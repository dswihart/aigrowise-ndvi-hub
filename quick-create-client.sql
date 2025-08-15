-- Quick SQL to create a client directly in the database
-- Run this on your server: ssh root@dashboard.aigrowise.com
-- Then: sudo -u postgres psql aigrowise_production

-- Create a test client account
INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'testclient@farm.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'CLIENT',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Check if user was created
SELECT email, role, "createdAt" FROM "User" WHERE email = 'testclient@farm.com';

-- Show all clients
SELECT email, role, "createdAt" FROM "User" WHERE role = 'CLIENT' ORDER BY "createdAt" DESC;