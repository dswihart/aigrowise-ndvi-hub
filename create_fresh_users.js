const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createFreshUsers() {
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
    const adminResult = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (, , , , NOW(), NOW()) RETURNING id, email, role',
      ['admin-001', 'admin@aigrowise.com', adminHash, 'ADMIN']
    );
    console.log('✅ Admin created:', adminResult.rows[0]);

    // Create client user  
    const clientHash = await bcrypt.hash('client123', 12);
    const clientResult = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (, , , , NOW(), NOW()) RETURNING id, email, role',
      ['client-001', 'client@test.com', clientHash, 'CLIENT']
    );
    console.log('✅ Client created:', clientResult.rows[0]);

    // Test password verification
    const adminUser = await client.query('SELECT password FROM "User" WHERE email = ', ['admin@aigrowise.com']);
    const isValidAdmin = await bcrypt.compare('admin123', adminUser.rows[0].password);
    console.log('🔑 Admin password test:', isValidAdmin);

    const clientUser = await client.query('SELECT password FROM "User" WHERE email = ', ['client@test.com']);
    const isValidClient = await bcrypt.compare('client123', clientUser.rows[0].password);
    console.log('🔑 Client password test:', isValidClient);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createFreshUsers();
