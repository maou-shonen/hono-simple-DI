import type { Context, MiddlewareHandler } from "hono";
import type { Scope } from "./types";
import type { MaybePromise } from "./utils";

/**
 * A Dependency class used for injecting services into hono.js context.
 */
export class Dependency<Service> {
  constructor(
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
      scope?: Scope;
    },
  ) {}

  // service cache
  private service?: Service;
  // used as a basis for caching when evaluating the request scope
  private lastRequest?: Request;

  /**
   * Injects a service instance directly. Useful for overriding the default service.
   */
  injection(service: Service): this {
    this.service = service;
    return this;
  }

  /**
   * Clear injected service.
   */
  clearInjected(): this {
    this.service = undefined;
    return this;
  }

  /**
   * Resolve service.
   */
  async resolve(c: Context): Promise<Service> {
    // evaluate and clear the cache when handling the request scope
    if (this.opts?.scope === "request" && this.lastRequest !== c.req.raw) {
      this.service = undefined;
      this.lastRequest = c.req.raw;
    }

    const service = (this.service ??= await this.serviceInitializer(c));

    return service;
  }

  /**
   * Creates a middleware that injects the service into the context.
   */
  middleware<ContextKey extends string>(
    /** The key used to store the service in the context. */
    contextKey: ContextKey,
  ): MiddlewareHandler<{
    Variables: {
      [key in ContextKey]: Service;
    };
  }> {
    return async (c, next) => {
      const service = await this.resolve(c);

      c.set(contextKey, service);

      await next();
    };
  }
}
