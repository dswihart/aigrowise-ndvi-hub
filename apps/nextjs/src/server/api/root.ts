import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { imagesRouter } from "./routers/images";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  images: imagesRouter,
});

export type AppRouter = typeof appRouter;