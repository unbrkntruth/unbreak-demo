import express, { type Application, type NextFunction, type Request, type Response } from "express";
import { createItemsRouter } from "./routes/items.js";
import { InMemoryStore } from "./store.js";

// app.del() predates the TypeScript migration; the alias still works, express just warns.
type LegacyApplication = Application & { del: Application["delete"] };

export function createApp(store: InMemoryStore = new InMemoryStore()): Application {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", createItemsRouter(store));

  (app as unknown as LegacyApplication).del("/api/items/:id", (req, res) => {
    if (!store.deleteItem(req.params.id)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(204).end();
  });

  // Catch-all 404. Must stay last among the routes.
  app.all("*", (req, res) => {
    res.status(404).json({ error: "Not found", path: req.originalUrl });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return app;
}
