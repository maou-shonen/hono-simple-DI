# Hono simple DI

This package is optimized for Hono.js and is not designed for large projects. If you require advanced DI features such as automatic circular injection, dynamic binding, and multi-binding, etc. you may need a dedicated DI library.

## Installation

```bash
# npm
npm install hono-simple-di
# pnpm
pnpm add hono-simple-di
# bun
bun add hono-simple-di
```

## Usage

### Basic usage

#### 1. Define a service

First, you define a service that you want to inject. This could be any class or function that handles your business logic.

```ts
// services/UserService.ts
export class UserService {
  findOne(id: number) {
    return { id, name: `User ${id}` };
  }
}
```

#### 2. Create a Dependency

Next, you create a dependency for your service, specifying how it should be initialized. You can also choose whether it should be a singleton (default) or multi-instance (per request).

```ts
import { Dependency } from "your-package-name";
import { UserService } from "./services/UserService";

// Define the dependency for UserService
const userDependency = new Dependency("userService", () => new UserService());
```

#### 3. Inject dependency via middleware

Use the middleware method to inject the dependency into your Hono.js context. Once injected, the service will be accessible through the context's c.get method.

```ts
import { Hono } from "hono";
import { userDependency } from "./dependencies";

const app = new Hono()
  // Use the dependency as middleware
  .use(userDependency.middleware())

  .get("/", (c) => {
    // Retrieve the injected service
    const { userService } = c.var;
    // or const userService = c.get('userService')

    const user = userService.findOne(1);

    return c.json(user);
  });
```

#### 4. Override Service with injection

You can override the service instance at runtime using the injection method. This is useful in testing or when dynamically providing service instances.

```ts
// Inject a custom service instance
userDependency.injection({
  findOne(id: number) {
    return { id, name: "Injected User" };
  },
});
```

### Using request scope service

If you need a new instance of the service for each request (multi-instance), set the scope option to `request`.

```ts
const requestIdDependency = new Dependency("requestID", (c) => Math.random(), {
  scope: "request",
});

const app = new Hono()
  // Inject a unique ID for each request
  .use(requestIdDependency.middleware())

  .get("/id", (c) => {
    const requestID = c.get("requestID");
    return c.text(`Request ID: ${requestID}`);
  });
```

## API

### `Dependency` Interface

```ts
interface Dependency<Service, ContextKeyDefault extends string> {
  constructor(
    /** The key used to store the service in the context. */
    private contextKey: ContextKeyDefault,
    /** A function to initialize the service. */
    private serviceInitializer: (c: Context) => MaybePromise<Service>,
    private opts?: {
      /**
       * The scope of the dependency.
       * @default 'default'
       * @remarks
       * - 'default': Service will be initialized only once.
       * - 'request': Service is initialized once per request and reused across requests.
       */
      scope?: Scope
    },
  ): Dependency

  /**
   * Injects a service instance directly. Useful for overriding the default service.
   * @param service - The service instance to be injected.
   * @returns this - The instance of the dependency for chaining.
   */
  injection(service: Service): this

  /**
   * Creates a middleware that injects the service into the context.
   * @param contextKey - Optionally override the key used to store the service in the context.
   * @returns MiddlewareHandler - A Hono.js middleware function.
   */
  middleware<ContextKeyOverride extends string | undefined = undefined>(
    contextKey?: ContextKeyOverride,
  ): MiddlewareHandler<{
    Variables: {
      [key in Default<ContextKeyOverride, ContextKeyDefault>]: Service
    }
  }>
}
```
