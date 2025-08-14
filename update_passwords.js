const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
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

    const password = 'password123';
    const adminHash = await bcrypt.hash(password, 12);
    const demoHash = await bcrypt.hash(password, 12);

    console.log('Generated hashes');
    console.log('Password:', password);

    await client.query('UPDATE "User" SET password =  WHERE email = ', [adminHash, 'admin@aigrowise.com']);
    console.log('Updated admin password');

    await client.query('UPDATE "User" SET password =  WHERE email = ', [demoHash, 'demo@aigrowise.com']);
    console.log('Updated demo password');

    const result = await client.query('SELECT email, password FROM "User"');
    for (const user of result.rows) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(user.email + ': ' + (isValid ? 'VALID' : 'INVALID'));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updatePasswords();
