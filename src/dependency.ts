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

  private service?: Service;

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
      const service =
        this.opts?.scope === "request"
          ? await this.serviceInitializer(c)
          : (this.service ??= await this.serviceInitializer(c));

      c.set(contextKey, service);

      await next();
    };
  }
}
