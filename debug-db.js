const db = require('./lib/jsonDb');

async function testDatabase() {
  try {
    console.log('Testing database operations...');
    
    // Test initialization
    console.log('1. Initializing database...');
    await db.init();
    console.log('✅ Database initialized');
    
    // Test reading empty database
    console.log('2. Reading database...');
    const users = await db.getUsers();
    console.log('✅ Users read:', users.length);
    
    // Test creating a user
    console.log('3. Creating test user...');
    const testUser = await db.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword',
      company: 'Test Company'
    });
    console.log('✅ User created:', testUser.id);
    
    // Test reading users again
    console.log('4. Reading users after creation...');
    const usersAfter = await db.getUsers();
    console.log('✅ Users after creation:', usersAfter.length);
    console.log('✅ User data:', usersAfter[0]);
    
    // Test logging activity
    console.log('5. Logging activity...');
    const activity = await db.logActivity({
      type: 'user_registration',
      userId: testUser.id,
      description: 'User registered successfully'
    });
    console.log('✅ Activity logged:', activity.id);
    
    console.log('🎉 All database operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testDatabase();
