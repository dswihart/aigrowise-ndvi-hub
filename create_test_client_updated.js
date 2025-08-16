const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createTestClient() {
  const client = new Client({
    connectionString: 'postgresql://aigrowise_user:aigrowise_pass@localhost:5433/aigrowise_production'
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const email = 'client@test.com';
    const password = 'client123';
    
    // Create hash
    const hash = await bcrypt.hash(password, 12);
    console.log('Created password hash');
    
    // Insert user
    const result = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING email, role',
      ['client-001', email, hash, 'CLIENT']
    );
    
    console.log('✅ Test client user created successfully!');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', result.rows[0].role);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestClient();
