import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp();
});

describe("GET /health", () => {
  it("reports ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/items", () => {
  it("defaults to page 1 with a limit of 10", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.total).toBe(5);
    expect(res.body.items).toHaveLength(5);
  });

  it("paginates with page and limit", async () => {
    const res = await request(app).get("/api/items?page=2&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.items.map((i: { id: string }) => i.id)).toEqual(["3", "4"]);
  });

  it("clamps limit to 100 and falls back on garbage", async () => {
    const res = await request(app).get("/api/items?page=abc&limit=1000");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(100);
  });

  it("filters by nested status query", async () => {
    const res = await request(app).get("/api/items?filter[status]=archived");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.every((i: { status: string }) => i.status === "archived")).toBe(true);
  });
});

describe("GET /api/items/:id", () => {
  it("returns an item", async () => {
    const res = await request(app).get("/api/items/2");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "2", name: "Gadget", price: 24.5 });
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).get("/api/items/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Item not found" });
  });
});

describe("POST /api/items", () => {
  it("creates an item", async () => {
    const res = await request(app).post("/api/items").send({ name: "Sprocket", price: 4.5 });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe("/api/items/6");
    expect(res.body).toMatchObject({ id: "6", name: "Sprocket", price: 4.5, status: "active" });
  });

  it("rejects a missing name", async () => {
    const res = await request(app).post("/api/items").send({ price: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });

  it("rejects a negative price", async () => {
    const res = await request(app).post("/api/items").send({ name: "Freebie", price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/price/);
  });
});

describe("PUT /api/items/:id/status", () => {
  it("archives an item", async () => {
    const res = await request(app).put("/api/items/1/status").send({ status: "archived" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("archived");
  });

  it("rejects an unknown status", async () => {
    const res = await request(app).put("/api/items/1/status").send({ status: "lost" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/users/:id/profile", () => {
  it("returns the user with an item count", async () => {
    const res = await request(app).get("/api/users/u1/profile");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "u1", name: "Ada", email: "ada@example.com", itemCount: 3 });
  });

  it("404s for an unknown user", async () => {
    const res = await request(app).get("/api/users/nobody/profile");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/items/:id", () => {
  it("deletes an item", async () => {
    const del = await request(app).delete("/api/items/3");
    expect(del.status).toBe(204);
    const after = await request(app).get("/api/items/3");
    expect(after.status).toBe(404);
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).delete("/api/items/999");
    expect(res.status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404 with the path", async () => {
    const res = await request(app).get("/nope/nothing");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found", path: "/nope/nothing" });
  });

  it("handles any method", async () => {
    const res = await request(app).post("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });
});
