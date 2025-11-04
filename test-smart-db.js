const smartDB = require('./lib/smart-db');

async function testSmartDatabase() {
    try {
        console.log('🚀 Testing Smart Database...');
        
        // Initialize the database
        await smartDB.initialize();
        
        // Show connection status
        const status = smartDB.getConnectionStatus();
        console.log('📊 Connection Status:', status.status);
        
        // Test family creation
        console.log('\n🧪 Testing family creation...');
        const testFamily = {
            id: 'test-family-001',
            name: 'Test Family',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@family.com',
            adminEmail: 'admin@test.com',
            adminPassword: 'test123',
            fileName: 'test-family.html',
            isActive: true
        };
        
        const familyResult = await smartDB.createFamily(testFamily);
        console.log('✅ Family created:', familyResult.insertedId || familyResult._id);
        
        // Test member creation
        console.log('\n👥 Testing member creation...');
        const testMember = {
            id: 'test-member-001',
            familyId: 'test-family-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+1234567890',
            role: 'member',
            password: 'member123',
            balance: 0,
            isActive: true
        };
        
        const memberResult = await smartDB.createMember(testMember);
        console.log('✅ Member created:', memberResult.insertedId || memberResult._id);
        
        // Test price plan creation
        console.log('\n💰 Testing price plan creation...');
        const testPricePlan = {
            id: 'test-plan-001',
            familyId: 'test-family-001',
            title: 'Test Plan',
            yearlyPrice: 1200,
            monthlyPrice: 100,
            description: 'Test pricing plan'
        };
        
        const planResult = await smartDB.createPricePlan(testPricePlan);
        console.log('✅ Price plan created:', planResult.insertedId || planResult._id);
        
        // Test retrieving data
        console.log('\n📊 Testing data retrieval...');
        const families = await smartDB.getAllFamilies();
        console.log('📊 Total families:', families.length);
        
        const members = await smartDB.getMembersByFamilyId('test-family-001');
        console.log('👥 Total members in test family:', members.length);
        
        const plans = await smartDB.getPricePlansByFamilyId('test-family-001');
        console.log('💰 Total price plans in test family:', plans.length);
        
        // Test activity logging
        console.log('\n📝 Testing activity logging...');
        await smartDB.logActivity({
            familyId: 'test-family-001',
            type: 'test',
            description: 'Smart database test',
            userId: 'test-user'
        });
        
        const activities = await smartDB.getActivitiesByFamilyId('test-family-001');
        console.log('📝 Total activities:', activities.length);
        
        console.log('\n🎉 All Smart Database tests passed successfully!');
        console.log('💡 Database is working with:', status.status);
        
    } catch (error) {
        console.error('❌ Smart Database test failed:', error);
    } finally {
        // Close connection if using MongoDB
        await smartDB.close();
    }
}

// Run the test
testSmartDatabase();
