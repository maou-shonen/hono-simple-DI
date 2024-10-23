import type { Context, MiddlewareHandler } from "hono";
import type { Scope } from "./types";
import type { Default, MaybePromise } from "./utils";

/**
 * A Dependency class used for injecting services into hono.js context.
 */
export class Dependency<Service, ContextKeyDefault extends string> {
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
   * Creates a middleware that injects the service into the context.
   */
  middleware<ContextKeyOverride extends string | undefined = undefined>(
    contextKey?: ContextKeyOverride,
  ): MiddlewareHandler<{
    Variables: {
      [key in Default<ContextKeyOverride, ContextKeyDefault>]: Service;
    };
  }> {
    return async (c, next) => {
      const key = (contextKey ?? this.contextKey) as Default<
        ContextKeyOverride,
        ContextKeyDefault
      >;

      const service =
        this.opts?.scope === "request"
          ? await this.serviceInitializer(c)
          : (this.service ??= await this.serviceInitializer(c));

      c.set(key, service);

      await next();
    };
  }
}
