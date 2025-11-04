import * as universalDB from './lib/mongodb-universal.js';

async function testUniversalMongoDB() {
    console.log('🌐 Testing Universal MongoDB Solution...\n');
    
    try {
        // Initialize database (will try Atlas -> Local -> JSON)
        await universalDB.initializeDB();
        
        // Get database status
        const status = universalDB.getDatabaseStatus();
        console.log('\n📊 Database Status:', status);
        
        // Test creating a user
        const testUser = {
            id: 'test-user-universal',
            email: 'test@universal.com',
            name: 'Universal Test User',
            role: 'admin'
        };
        
        const userResult = await universalDB.createUser(testUser);
        console.log('✅ Test user created:', userResult);
        
        // Test retrieving users
        const users = await universalDB.getAllUsers();
        console.log('✅ Retrieved users:', users.length);
        
        // Test creating a family
        const testFamily = {
            id: 'test-family-universal',
            name: 'Universal Test Family',
            description: 'Test family for universal database testing'
        };
        
        const familyResult = await universalDB.createFamily(testFamily);
        console.log('✅ Test family created:', familyResult);
        
        // Test retrieving families
        const families = await universalDB.getAllFamilies();
        console.log('✅ Retrieved families:', families.length);
        
        console.log('\n🎉 All Universal MongoDB tests passed!');
        console.log('📊 Final Database Status:', universalDB.getDatabaseStatus());
        
        // Show which database is being used
        if (status.usingMongoDB) {
            console.log('🎯 Using: MongoDB Atlas (Cloud)');
        } else if (status.usingLocalMongoDB) {
            console.log('🎯 Using: Local MongoDB');
        } else {
            console.log('🎯 Using: JSON File Storage (Fallback)');
        }
        
    } catch (error) {
        console.error('❌ Universal MongoDB test failed:', error);
    } finally {
        // Close connection
        await universalDB.closeConnection();
    }
}

testUniversalMongoDB();
