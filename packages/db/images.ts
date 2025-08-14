import { Image, Prisma } from "@prisma/client";
import { prisma } from "./index";

export type CreateImageInput = {
  url: string;
  userId: string;
  filename?: string;
  title?: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
};

export type UpdateImageInput = {
  id: string;
  url?: string;
  filename?: string;
  title?: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
};

export async function createImage(input: CreateImageInput): Promise<Image> {
  const created = await prisma.image.create({
    data: {
      url: input.url,
      userId: input.userId,
      filename: input.filename,
      title: input.title,
      description: input.description,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    },
  });
  return created;
}

export async function findImageById(imageId: string): Promise<Image | null> {
  return prisma.image.findUnique({ 
    where: { id: imageId },
    include: { user: true }
  });
}

export async function updateImage(input: UpdateImageInput): Promise<Image> {
  const { id, ...updateData } = input;
  return prisma.image.update({
    where: { id },
    data: updateData,
  });
}

export async function listImagesByUser(userId: string, params?: {
  skip?: number;
  take?: number;
  cursor?: Prisma.ImageWhereUniqueInput;
  orderBy?: Prisma.ImageOrderByWithRelationInput;
  include?: Prisma.ImageInclude;
}): Promise<Image[]> {
  return prisma.image.findMany({
    where: { userId },
    skip: params?.skip,
    take: params?.take,
    cursor: params?.cursor,
    orderBy: params?.orderBy,
    include: params?.include,
  });
}

export async function listAllImages(params?: {
  skip?: number;
  take?: number;
  cursor?: Prisma.ImageWhereUniqueInput;
  orderBy?: Prisma.ImageOrderByWithRelationInput;
  where?: Prisma.ImageWhereInput;
  include?: Prisma.ImageInclude;
}): Promise<Image[]> {
  return prisma.image.findMany({
    skip: params?.skip,
    take: params?.take,
    cursor: params?.cursor,
    orderBy: params?.orderBy,
    where: params?.where,
    include: params?.include,
  });
}

export async function deleteImage(imageId: string): Promise<Image> {
  return prisma.image.delete({ where: { id: imageId } });
}

export async function getImageStats(userId?: string) {
  const where = userId ? { userId } : {};
  
  const totalImages = await prisma.image.count({ where });
  const totalSize = await prisma.image.aggregate({
    where,
    _sum: { fileSize: true }
  });
  
  return {
    totalImages,
    totalSize: totalSize._sum.fileSize || 0,
  };
}
