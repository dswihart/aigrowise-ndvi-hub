-- Ensure required extension for bcrypt and UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
  END IF;
END $$;

-- Create User table if missing
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Image table if missing
CREATE TABLE IF NOT EXISTS "Image" (
  "id" TEXT PRIMARY KEY,
  "url" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on Image.userId if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Image_user_id_idx') THEN
    CREATE INDEX "Image_user_id_idx" ON "Image" ("userId");
  END IF;
END $$;

-- FK if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Image_userId_fkey'
  ) THEN
    ALTER TABLE "Image"
      ADD CONSTRAINT "Image_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Upsert admin user with bcrypt password via pgcrypto
INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@aigrowise.com',
  'Admin',
  crypt('ChangeMe123!', gen_salt('bf')),
  'ADMIN',
  now(),
  now()
)
ON CONFLICT (email)
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  role = 'ADMIN',
  "updatedAt" = now();


