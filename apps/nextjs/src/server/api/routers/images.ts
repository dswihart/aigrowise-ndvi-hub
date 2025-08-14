import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { 
  createImage, 
  listImagesByUser, 
  findImageById,
  listAllImages,
  deleteImage,
  updateImage,
  CreateImageInput 
} from "@bmad-aigrowise/db/images";
import { 
  findUserById, 
  findUserByEmail, 
  createUser,
  listUsers 
} from "@bmad-aigrowise/db/users";
import { TRPCError } from "@trpc/server";

export const imagesRouter = createTRPCRouter({
  // Client endpoints
  getMyImages: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as any).id;
    const images = await listImagesByUser(userId, {
      orderBy: { createdAt: "desc" },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      filename: image.filename,
      title: image.title,
      description: image.description,
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      createdAt: image.createdAt,
    }));
  }),

  getImageById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session.user as any).id;
      const userRole = (ctx.session.user as any).role;
      
      const image = await findImageById(input.id);

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      // Allow admin to see all images, clients only their own
      if (userRole !== "ADMIN" && image.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return {
        id: image.id,
        url: image.url,
        filename: image.filename,
        title: image.title,
        description: image.description,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        createdAt: image.createdAt,
        user: {
          id: (image as any).user.id,
          email: (image as any).user.email,
        }
      };
    }),

  // Admin endpoints
  uploadForClient: adminProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        clientEmail: z.string().email(),
        filename: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
        filename: input.filename,
        title: input.title,
        description: input.description,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      });

      return {
        success: true,
        image: {
          id: image.id,
          url: image.url,
          filename: image.filename,
          title: image.title,
          clientEmail: client.email,
          createdAt: image.createdAt,
        },
      };
    }),

  getAllImages: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        clientId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where = input.clientId ? { userId: input.clientId } : {};
      
      const images = await listAllImages({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (images.length > input.limit) {
        const nextItem = images.pop();
        nextCursor = nextItem!.id;
      }

      return {
        images: images.map((image) => ({
          id: image.id,
          url: image.url,
          filename: image.filename,
          title: image.title,
          description: image.description,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          createdAt: image.createdAt,
          user: {
            id: (image as any).user.id,
            email: (image as any).user.email,
          }
        })),
        nextCursor,
      };
    }),

  getAllClients: adminProcedure.query(async ({ ctx }) => {
    const clients = await listUsers({
      where: { role: "CLIENT" },
      orderBy: { email: "asc" },
    });

    // Get image count for each client
    const clientsWithImageCount = await Promise.all(
      clients.map(async (client) => {
        const images = await listImagesByUser(client.id);
        return {
          id: client.id,
          email: client.email,
          imageCount: images.length,
          createdAt: client.createdAt,
        };
      })
    );

    return clientsWithImageCount;
  }),

  createClient: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = await findUserByEmail(input.email);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(input.password, 12);

      const client = await createUser({
        email: input.email,
        password: hashedPassword,
        role: "CLIENT",
      });

      return {
        success: true,
        client: {
          id: client.id,
          email: client.email,
          createdAt: client.createdAt,
        },
      };
    }),

  deleteImage: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const image = await findImageById(input.id);

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      await deleteImage(input.id);

      return {
        success: true,
        message: "Image deleted successfully",
      };
    }),

  updateImage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const image = await findImageById(input.id);

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      const updatedImage = await updateImage({
        id: input.id,
        title: input.title,
        description: input.description,
      });

      // Get user info for response
      const user = await findUserById(updatedImage.userId);

      return {
        success: true,
        image: {
          id: updatedImage.id,
          url: updatedImage.url,
          filename: updatedImage.filename,
          title: updatedImage.title,
          description: updatedImage.description,
          createdAt: updatedImage.createdAt,
          user: {
            email: user?.email || "",
          }
        },
      };
    }),
});
