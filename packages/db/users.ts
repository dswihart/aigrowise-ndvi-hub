import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "./index";

export type CreateUserInput = {
  email: string;
  password: string;
  role?: Role;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const created = await prisma.user.create({
    data: {
      email: input.email,
      password: input.password,
      role: input.role ?? Role.CLIENT,
    },
  });
  return created;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

export type UpdateUserInput = {
  password?: string;
  role?: Role;
};

export async function updateUser(userId: string, data: UpdateUserInput): Promise<User> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return updated;
}

export async function deleteUser(userId: string): Promise<User> {
  return prisma.user.delete({ where: { id: userId } });
}

export async function listUsers(params?: {
  skip?: number;
  take?: number;
  cursor?: Prisma.UserWhereUniqueInput;
  where?: Prisma.UserWhereInput;
  orderBy?: Prisma.UserOrderByWithRelationInput;
}): Promise<User[]> {
  const users = await prisma.user.findMany({
    skip: params?.skip,
    take: params?.take,
    cursor: params?.cursor,
    where: params?.where,
    orderBy: params?.orderBy,
  });
  return users;
}


