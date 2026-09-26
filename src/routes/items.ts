import { Router, type NextFunction, type Request, type Response } from "express";
import type { InMemoryStore, ItemStatus } from "../store.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

interface Pagination {
  page: number;
  limit: number;
}

/**
 * Normalises pagination params so downstream handlers can trust them.
 * req.query is a getter in Express 5, so the normalised values are published
 * on res.locals instead of being written back into req.query.
 */
function paginate(req: Request, res: Response, next: NextFunction): void {
  const rawPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  const rawLimit = Number.parseInt(String(req.query.limit ?? String(DEFAULT_LIMIT)), 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT : Math.min(rawLimit, MAX_LIMIT);

  res.locals.pagination = { page, limit } satisfies Pagination;
  next();
}

function isStatus(value: unknown): value is ItemStatus {
  return value === "active" || value === "archived";
}

export function createItemsRouter(store: InMemoryStore): Router {
  const router = Router();

  router.use(paginate);

  // GET /items?page=&limit=&filter[status]=
  router.get("/items", (req, res) => {
    const { page, limit } = res.locals.pagination as Pagination;

    let items = store.listItems();

    // Nested query objects come from the "extended" query parser (qs).
    const filter = req.query.filter;
    if (filter && typeof filter === "object" && !Array.isArray(filter) && isStatus(filter.status)) {
      const status = filter.status;
      items = items.filter((item) => item.status === status);
    }

    const start = (page - 1) * limit;
    res.json({
      page,
      limit,
      total: items.length,
      items: items.slice(start, start + limit),
    });
  });

  // GET /items/:id
  router.get("/items/:id", (req, res) => {
    const item = store.getItem(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  });

  // POST /items
  router.post("/items", (req, res) => {
    const body: unknown = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Body must be a JSON object" });
      return;
    }
    const { name, price, ownerId } = body as Record<string, unknown>;
    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      res.status(400).json({ error: "price must be a non-negative number" });
      return;
    }
    const item = store.createItem({
      name: name.trim(),
      price,
      ...(typeof ownerId === "string" ? { ownerId } : {}),
    });
    res.status(201).location(`/api/items/${item.id}`).json(item);
  });

  // PUT /items/:id/status
  router.put("/items/:id/status", (req, res) => {
    const status: unknown = (req.body as Record<string, unknown> | undefined)?.status;
    if (!isStatus(status)) {
      res.status(400).json({ error: "status must be 'active' or 'archived'" });
      return;
    }
    const item = store.updateItem(req.params.id, { status });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  });

  // GET /users/:id/profile
  // Async handler. Errors thrown here are not forwarded to next().
  router.get("/users/:id/profile", async (req, res) => {
    const user = await store.findUser(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const owned = store.listItems().filter((item) => item.ownerId === user.id);
    res.json({ ...user, itemCount: owned.length });
  });

  return router;
}
