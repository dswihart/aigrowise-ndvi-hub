import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { createImage, listImagesByUser, findUserById, findUserByEmail } from "@bmad-aigrowise/db";
import { TRPCError } from "@trpc/server";

export const imagesRouter = createTRPCRouter({
  getMyImages: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as any).id;
    const images = await listImagesByUser(userId, {
      orderBy: { createdAt: "desc" },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      createdAt: image.createdAt,
    }));
  }),

  uploadForClient: adminProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        clientEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const client = await findUserByEmail(input.clientEmail);
      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      if (client.role !== "CLIENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not a client",
        });
      }

      const image = await createImage({
        url: input.imageUrl,
        userId: client.id,
      });

      return {
        success: true,
        image: {
          id: image.id,
          url: image.url,
          clientEmail: client.email,
          createdAt: image.createdAt,
        },
      };
    }),

  getAllClients: adminProcedure.query(async () => {
    const { listUsers } = await import("@bmad-aigrowise/db");
    const clients = await listUsers({
      where: { role: "CLIENT" },
      orderBy: { email: "asc" },
    });

    return clients.map((client) => ({
      id: client.id,
      email: client.email,
      createdAt: client.createdAt,
    }));
  }),
});