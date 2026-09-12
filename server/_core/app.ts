import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";

type CreateAppOptions = {
  /** When false, skip SPA static hosting (Vercel serves dist/public). */
  serveFrontend?: boolean;
};

export async function createApp(options: CreateAppOptions = {}) {
  const { serveFrontend = true } = options;
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (serveFrontend && process.env.NODE_ENV !== "development") {
    serveStatic(app);
  }

  return app;
}
