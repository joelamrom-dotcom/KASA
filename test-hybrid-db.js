import * as hybridDB from './lib/hybrid-db.js';

async function testHybridDatabase() {
    console.log('🔌 Testing Hybrid Database Solution...');
    
    try {
        // Initialize database
        await hybridDB.initializeDB();
        
        // Get database status
        const status = hybridDB.getDatabaseStatus();
        console.log('📊 Database Status:', status);
        
        // Test creating a user
        const testUser = {
            id: 'test-user-001',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin'
        };
        
        const userResult = await hybridDB.createUser(testUser);
        console.log('✅ Test user created:', userResult);
        
        // Test retrieving users
        const users = await hybridDB.getAllUsers();
        console.log('✅ Retrieved users:', users.length);
        
        // Test creating a family
        const testFamily = {
            id: 'test-family-001',
            name: 'Test Family',
            description: 'Test family for hybrid database testing'
        };
        
        const familyResult = await hybridDB.createFamily(testFamily);
        console.log('✅ Test family created:', familyResult);
        
        // Test retrieving families
        const families = await hybridDB.getAllFamilies();
        console.log('✅ Retrieved families:', families.length);
        
        // Test creating a member
        const testMember = {
            id: 'test-member-001',
            familyId: 'test-family-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
        };
        
        const memberResult = await hybridDB.createMember(testMember);
        console.log('✅ Test member created:', memberResult);
        
        // Test retrieving members by family
        const members = await hybridDB.getMembersByFamilyId('test-family-001');
        console.log('✅ Retrieved members for family:', members.length);
        
        // Test creating an activity
        const testActivity = {
            id: 'test-activity-001',
            type: 'user_created',
            description: 'Test user created',
            userId: 'test-user-001'
        };
        
        const activityResult = await hybridDB.createActivity(testActivity);
        console.log('✅ Test activity created:', activityResult);
        
        // Test retrieving activities
        const activities = await hybridDB.getAllActivities();
        console.log('✅ Retrieved activities:', activities.length);
        
        console.log('🎉 All Hybrid Database tests passed!');
        console.log('📊 Final Database Status:', hybridDB.getDatabaseStatus());
        
    } catch (error) {
        console.error('❌ Hybrid Database test failed:', error);
    } finally {
        // Close connection
        await hybridDB.closeConnection();
    }
}

// Run the test
testHybridDatabase();
