import { describe, expect, it } from "vitest";
import { Dependency } from "./dependency";
import { Hono } from "hono";

describe("Dependency", () => {
  class TestService {
    constructor(public name: string) {}

    hi() {
      return `Hello ${this.name}`;
    }
  }

  it("create", () => {
    const dep = new Dependency(() => null);
    expect(dep).instanceOf(Dependency);
  });

  it("basic", async () => {
    const dep = new Dependency(() => new TestService("foo"));
    const app = new Hono()
      .use(dep.middleware("service"))
      .get("/", (c) =>
        c.text(c.var.service.name, "service" in c.var ? 200 : 400),
      );

    const res = await app.request("/");
    expect(res.status).toBe(200);
    const data = await res.text();
    expect(data).toBe("foo");
  });

  it("injection", async () => {
    const dep = new Dependency(() => new TestService("foo"));
    const app = new Hono()
      .use(dep.middleware("service"))
      .get("/", (c) => c.text(c.var.service.name));

    dep.injection(new TestService("bar"));

    const res = await app.request("/");
    expect(res.status).toBe(200);
    const data = await res.text();
    expect(data).toBe("bar");
  });

  it("injection with default scope", async () => {
    let createCount = 0;
    const createService = () => {
      createCount++;
      return new TestService("foo");
    };

    const dep = new Dependency(() => createService(), {
      scope: "default",
    });
    const app = new Hono()
      .use(dep.middleware("service"))
      .get("/", (c) => c.text(c.var.service.name));

    const res1 = await app.request("/");
    expect(res1.status).toBe(200);
    expect(await res1.text()).toBe("foo");
    const res2 = await app.request("/");
    expect(res2.status).toBe(200);
    expect(await res2.text()).toBe("foo");

    expect(createCount).toBe(1);
  });

  it("injection with request scope", async () => {
    let createCount = 0;
    const createService = () => {
      createCount++;
      return new TestService("foo");
    };

    const dep = new Dependency(() => createService(), {
      scope: "request",
    });
    const app = new Hono()
      .use(dep.middleware("service"))
      .get("/", (c) => c.text(c.var.service.name));

    const res1 = await app.request("/");
    expect(res1.status).toBe(200);
    expect(await res1.text()).toBe("foo");
    const res2 = await app.request("/");
    expect(res2.status).toBe(200);
    expect(await res2.text()).toBe("foo");

    expect(createCount).toBe(2);
  });
});
