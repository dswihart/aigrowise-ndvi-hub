#!/usr/bin/env bash
set -euo pipefail

# Usage: ./make_admin.sh [password]
PASS="${1:-ChangeMe123!}"

cd /opt/aigrowise

# Compute bcrypt hash in app container using bcryptjs from node_modules
HASH=$(docker-compose exec -T app node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" "$PASS")

# Create schema objects if missing and upsert admin user
docker-compose exec -T db psql -U aigrowise -d aigrowise -v ON_ERROR_STOP=1 \
  -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN CREATE TYPE \"Role\" AS ENUM ('USER','ADMIN'); END IF; END $$;" \
  -c "CREATE TABLE IF NOT EXISTS \"User\" (\"id\" TEXT PRIMARY KEY, \"email\" TEXT UNIQUE NOT NULL, \"name\" TEXT, \"passwordHash\" TEXT NOT NULL, \"role\" \"Role\" NOT NULL DEFAULT 'USER', \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);" \
  -c "CREATE TABLE IF NOT EXISTS \"Image\" (\"id\" TEXT PRIMARY KEY, \"url\" TEXT NOT NULL, \"userId\" TEXT NOT NULL, \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);" \
  -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Image_user_id_idx') THEN CREATE INDEX \"Image_user_id_idx\" ON \"Image\" (\"userId\"); END IF; END $$;" \
  -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Image_userId_fkey') THEN ALTER TABLE \"Image\" ADD CONSTRAINT \"Image_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;" \
  -c "INSERT INTO \"User\" (id,email,name,\"passwordHash\",role,\"createdAt\",\"updatedAt\") VALUES ('adm-' || substr(md5(random()::text || clock_timestamp()::text),1,24),'admin@aigrowise.com','Admin','$HASH','ADMIN',now(),now()) ON CONFLICT (email) DO UPDATE SET \"passwordHash\"=EXCLUDED.\"passwordHash\", role='ADMIN', \"updatedAt\"=now();"

echo "Admin user ready. Email: admin@aigrowise.com"
echo "Admin password: $PASS"


