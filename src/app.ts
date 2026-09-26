import express, { type Application, type NextFunction, type Request, type Response } from "express";
import { createItemsRouter } from "./routes/items.js";
import { InMemoryStore } from "./store.js";

export function createApp(store: InMemoryStore = new InMemoryStore()): Application {
  const app = express();

  // Express 5 defaults to the "simple" query parser; restore "extended" (qs) so
  // nested query syntax like filter[status]=active keeps working.
  app.set("query parser", "extended");

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", createItemsRouter(store));

  app.delete("/api/items/:id", (req, res) => {
    if (!store.deleteItem(req.params.id)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(204).end();
  });

  // Catch-all 404. Must stay last among the routes.
  app.all("/{*splat}", (req, res) => {
    res.status(404).json({ error: "Not found", path: req.originalUrl });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return app;
}
