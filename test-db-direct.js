const db = require('./lib/jsonDb.js');

async function testDatabase() {
  console.log('Testing database operations...');
  
  try {
    // Test getting users
    console.log('1. Getting users...');
    const users = await db.getUsers();
    console.log('Current users:', users);
    
    // Test creating a user
    console.log('2. Creating test user...');
    const testUser = await db.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      company: 'Test Company',
      role: 'user',
      isActive: true,
      emailVerified: false
    });
    console.log('Created user:', testUser);
    
    // Test getting users again
    console.log('3. Getting users after creation...');
    const usersAfter = await db.getUsers();
    console.log('Users after creation:', usersAfter);
    
  } catch (error) {
    console.error('Database test error:', error);
  }
}

testDatabase();
