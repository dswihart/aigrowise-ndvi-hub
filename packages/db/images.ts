import { Image, Prisma } from "@prisma/client";
import { prisma } from "./index";

export type CreateImageInput = {
  url: string;
  userId: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  originalFileName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  format?: string;
  channels?: number;
  colorspace?: string;
  hasAlpha?: boolean;
  compressionRatio?: number;
  isProcessed?: boolean;
  processingStatus?: string;
};

export async function createImage(input: CreateImageInput): Promise<Image> {
  const created = await prisma.image.create({
    data: input,
  });
  return created;
}

export async function findImageById(imageId: string): Promise<Image | null> {
  return prisma.image.findUnique({ where: { id: imageId } });
}

export async function listImagesByUser(userId: string, params?: {
  skip?: number;
  take?: number;
  cursor?: Prisma.ImageWhereUniqueInput;
  orderBy?: Prisma.ImageOrderByWithRelationInput;
}): Promise<Image[]> {
  return prisma.image.findMany({
    where: { userId },
    skip: params?.skip,
    take: params?.take,
    cursor: params?.cursor,
    orderBy: params?.orderBy,
  });
}

export async function updateImage(
  imageId: string, 
  data: Partial<CreateImageInput>
): Promise<Image> {
  return prisma.image.update({
    where: { id: imageId },
    data,
  });
}

export async function updateImageProcessingStatus(
  imageId: string,
  status: string,
  processingData?: {
    thumbnailUrl?: string;
    optimizedUrl?: string;
    compressionRatio?: number;
    isProcessed?: boolean;
  }
): Promise<Image> {
  return prisma.image.update({
    where: { id: imageId },
    data: {
      processingStatus: status,
      ...processingData,
    },
  });
}

export async function listImagesPendingProcessing(): Promise<Image[]> {
  return prisma.image.findMany({
    where: { processingStatus: "pending" },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteImage(imageId: string): Promise<Image> {
  return prisma.image.delete({ where: { id: imageId } });
}


