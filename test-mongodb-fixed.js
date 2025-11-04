const mongoDB = require('./lib/mongodb-fixed');

async function testMongoDBConnection() {
    console.log('🔌 Testing MongoDB connection with SSL fixes...');
    
    try {
        // Test connection
        await mongoDB.connectToMongoDB();
        console.log('✅ MongoDB connection successful!');
        
        // Initialize collections
        await mongoDB.initializeCollections();
        console.log('✅ Collections initialized!');
        
        // Test creating a user
        const testUser = {
            id: 'test-user-001',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin'
        };
        
        const result = await mongoDB.createUser(testUser);
        console.log('✅ Test user created:', result);
        
        // Test retrieving users
        const users = await mongoDB.getAllUsers();
        console.log('✅ Retrieved users:', users.length);
        
        // Test creating a family
        const testFamily = {
            id: 'test-family-001',
            name: 'Test Family',
            description: 'Test family for connection testing'
        };
        
        const familyResult = await mongoDB.createFamily(testFamily);
        console.log('✅ Test family created:', familyResult);
        
        // Test retrieving families
        const families = await mongoDB.getAllFamilies();
        console.log('✅ Retrieved families:', families.length);
        
        console.log('🎉 All MongoDB tests passed!');
        
    } catch (error) {
        console.error('❌ MongoDB test failed:', error);
    } finally {
        // Close connection
        await mongoDB.closeConnection();
    }
}

// Run the test
testMongoDBConnection();
