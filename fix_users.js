const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fixUsers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'aigrowise_production', 
    user: 'aigrowise_user',
    password: 'aigrowise_pass'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Clear existing users
    await client.query('DELETE FROM "User"');
    console.log('Cleared existing users');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (, , , , NOW(), NOW())',
      ['admin-001', 'admin@aigrowise.com', adminHash, 'ADMIN']
    );
    console.log('✅ Admin created: admin@aigrowise.com / admin123');

    // Create client user  
    const clientHash = await bcrypt.hash('client123', 12);
    await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (, , , , NOW(), NOW())',
      ['client-001', 'client@test.com', clientHash, 'CLIENT']
    );
    console.log('✅ Client created: client@test.com / client123');

    // Verify
    const users = await client.query('SELECT id, email, role FROM "User"');
    console.log('Users in database:', users.rows);

    // Test password verification
    const admin = await client.query('SELECT password FROM "User" WHERE email = ', ['admin@aigrowise.com']);
    const isValidAdmin = await bcrypt.compare('admin123', admin.rows[0].password);
    console.log('🔑 Admin password test:', isValidAdmin);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixUsers();
