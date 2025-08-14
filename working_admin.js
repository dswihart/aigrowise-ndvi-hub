const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new Client({
    connectionString: 'postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production'
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const email = 'admin@aigrowise.com';
    const password = 'admin123';
    
    // Delete existing user
    await client.query('DELETE FROM "User" WHERE email = ', [email]);
    console.log('Deleted existing admin');
    
    // Create hash
    const hash = await bcrypt.hash(password, 12);
    console.log('Created password hash');
    
    // Insert user with proper escaping
    const result = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (, , , , NOW(), NOW()) RETURNING email, role',
      ['admin-working', email, hash, 'ADMIN']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', result.rows[0].role);
    
    // Test the hash
    const testQuery = await client.query('SELECT password FROM "User" WHERE email = ', [email]);
    const isValid = await bcrypt.compare(password, testQuery.rows[0].password);
    console.log('🧪 Password verification:', isValid);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
