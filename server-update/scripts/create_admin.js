const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

(async () => {
  const prisma = new PrismaClient();
  const ddlStatements = [
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN CREATE TYPE \"Role\" AS ENUM ('USER','ADMIN'); END IF; END $$;",
    "CREATE TABLE IF NOT EXISTS \"User\" (\"id\" TEXT PRIMARY KEY, \"email\" TEXT UNIQUE NOT NULL, \"name\" TEXT, \"passwordHash\" TEXT NOT NULL, \"role\" \"Role\" NOT NULL DEFAULT 'USER', \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);",
    "CREATE TABLE IF NOT EXISTS \"Image\" (\"id\" TEXT PRIMARY KEY, \"url\" TEXT NOT NULL, \"userId\" TEXT NOT NULL, \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Image_user_id_idx') THEN CREATE INDEX \"Image_user_id_idx\" ON \"Image\" (\"userId\"); END IF; END $$;",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Image_userId_fkey') THEN ALTER TABLE \"Image\" ADD CONSTRAINT \"Image_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;",
  ];

  try {
    // Try to ensure schema exists (idempotent)
    for (const sql of ddlStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        console.log('Note:', e.message);
      }
    }

    const password = process.env.ADMIN_PASS || 'ChangeMe123!';
    const hash = bcrypt.hashSync(password, 10);

    await prisma.user.upsert({
      where: { email: 'admin@aigrowise.com' },
      update: { passwordHash: hash, role: 'ADMIN' },
      create: {
        id: crypto.randomUUID(),
        email: 'admin@aigrowise.com',
        name: 'Admin',
        passwordHash: hash,
        role: 'ADMIN',
      },
    });

    console.log('Admin password:', password);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();


