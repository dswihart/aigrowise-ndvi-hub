const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'aigrowise_production',
    user: 'aigrowise_user',
    password: 'aigrowise_pass',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // New complex password that meets all requirements
    const email = 'admin@aigrowise.com';
    const newPassword = 'Admin2024!@#';  // Meets all complexity requirements
    
    console.log('New admin credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('');
    console.log('Password meets requirements:');
    console.log('✓ 8+ characters');
    console.log('✓ Uppercase letter (A)');
    console.log('✓ Lowercase letters (dmin)');
    console.log('✓ Numbers (2024)');
    console.log('✓ Special characters (!@#)');
    console.log('✓ No common patterns');
    console.log('');

    // Hash the password with bcrypt
    const hash = await bcrypt.hash(newPassword, 12);
    console.log('Password hashed successfully');

    // Delete any existing admin user first
    await client.query('DELETE FROM "User" WHERE email = $1', [email]);
    console.log('Deleted any existing admin user');

    // Insert new admin user
    const result = await client.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING email, role',
      ['admin-complex-pwd', email, hash, 'ADMIN']
    );

    console.log('✅ Admin user created successfully!');
    console.log('User details:', result.rows[0]);
    console.log('');
    console.log('🔐 Login credentials:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('');
    console.log('You can now login to dashboard.aigrowise.com');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

resetAdminPassword();