const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createTestClient() {
  const client = new Client({
    connectionString: 'postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production'
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const email = 'testclient@example.com';
    const password = 'testpass123';
    
    // Check if client already exists
    const existing = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('✅ Test client already exists:', email);
      return;
    }
    
    // Create hash
    const hash = await bcrypt.hash(password, 12);
    console.log('Created password hash');
    
    // Insert client
    const result = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING email, role',
      ['client-test-001', email, hash, 'CLIENT']
    );
    
    console.log('✅ Test client created successfully!');
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
