export type ItemStatus = "active" | "archived";

export interface Item {
  id: string;
  name: string;
  price: number;
  status: ItemStatus;
  ownerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface NewItem {
  name: string;
  price: number;
  ownerId?: string;
}

const SEED_USERS: User[] = [
  { id: "u1", name: "Ada", email: "ada@example.com" },
  { id: "u2", name: "Grace", email: "grace@example.com" },
];

const SEED_ITEMS: Item[] = [
  { id: "1", name: "Widget", price: 9.99, status: "active", ownerId: "u1" },
  { id: "2", name: "Gadget", price: 24.5, status: "active", ownerId: "u1" },
  { id: "3", name: "Gizmo", price: 3.25, status: "archived", ownerId: "u2" },
  { id: "4", name: "Doohickey", price: 12, status: "active", ownerId: "u2" },
  { id: "5", name: "Thingamajig", price: 99, status: "archived", ownerId: "u1" },
];

/** In-memory data store. Each app instance gets its own copy of the seed data. */
export class InMemoryStore {
  private readonly items = new Map<string, Item>();
  private readonly users = new Map<string, User>();
  private nextId: number;

  constructor() {
    for (const item of SEED_ITEMS) this.items.set(item.id, { ...item });
    for (const user of SEED_USERS) this.users.set(user.id, { ...user });
    this.nextId = SEED_ITEMS.length + 1;
  }

  listItems(): Item[] {
    return [...this.items.values()];
  }

  getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  createItem(input: NewItem): Item {
    const item: Item = {
      id: String(this.nextId++),
      name: input.name,
      price: input.price,
      status: "active",
      ownerId: input.ownerId ?? "u1",
    };
    this.items.set(item.id, item);
    return item;
  }

  updateItem(id: string, patch: Partial<Omit<Item, "id">>): Item | undefined {
    const current = this.items.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  deleteItem(id: string): boolean {
    return this.items.delete(id);
  }

  /** Simulates a network call to a user service. */
  async findUser(id: string): Promise<User | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (id === "crash") {
      throw new Error("user service unavailable");
    }
    return this.users.get(id);
  }
}
