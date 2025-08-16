import { prisma } from "./prisma";
import type { User, Image, Role } from "@prisma/client";

// User operations
export async function findUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  role?: Role;
}): Promise<User> {
  return await prisma.user.create({
    data,
  });
}

export async function updateUser(id: string, data: Partial<Pick<User, 'email' | 'password' | 'role'>>): Promise<User> {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string): Promise<User> {
  return await prisma.user.delete({
    where: { id },
  });
}

export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUsersByRole(role: Role): Promise<User[]> {
  return await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' },
  });
}

// Image operations
export async function createImage(data: {
  url: string;
  filename?: string | null;
  title?: string | null;
  description?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  userId: string;
}): Promise<Image> {
  return await prisma.image.create({
    data,
  });
}

export async function findImageById(id: string): Promise<(Image & { user: User }) | null> {
  return await prisma.image.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
}

export async function getImagesByUserId(userId: string): Promise<(Image & { user: { id: string; email: string; role: Role } })[]> {
  return await prisma.image.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getAllImages(): Promise<(Image & { user: { id: string; email: string; role: Role } })[]> {
  return await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function updateImage(id: string, data: Partial<Omit<Image, 'id' | 'createdAt'>>): Promise<Image> {
  return await prisma.image.update({
    where: { id },
    data,
  });
}

export async function deleteImage(id: string): Promise<Image> {
  return await prisma.image.delete({
    where: { id },
  });
}

// Statistics and analytics
export async function getUserStats(userId: string): Promise<{
  totalImages: number;
  totalStorageUsed: number;
}> {
  const [totalImages, storageData] = await Promise.all([
    prisma.image.count({ where: { userId } }),
    prisma.image.aggregate({
      where: { userId },
      _sum: { fileSize: true },
    }),
  ]);

  return {
    totalImages,
    totalStorageUsed: storageData._sum.fileSize || 0,
  };
}

export async function getSystemStats(): Promise<{
  totalUsers: number;
  totalClients: number;
  totalAdmins: number;
  totalImages: number;
  totalStorageUsed: number;
  recentUploads: (Image & { user: { id: string; email: string; role: Role } })[];
}> {
  const [
    totalUsers, 
    totalClients, 
    totalAdmins, 
    totalImages, 
    storageData, 
    recentUploads
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.image.count(),
    prisma.image.aggregate({ _sum: { fileSize: true } }),
    prisma.image.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalClients,
    totalAdmins,
    totalImages,
    totalStorageUsed: storageData._sum.fileSize || 0,
    recentUploads,
  };
}
