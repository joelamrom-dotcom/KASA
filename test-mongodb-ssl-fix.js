import * as mongoSSL from './lib/mongodb-ssl-fix.js';

async function testMongoDBSSLFix() {
    console.log('🔧 Testing MongoDB SSL Connection Fixes...\n');
    
    try {
        // Test different connection configurations
        const testResult = await mongoSSL.testMongoDBConnection();
        
        if (testResult.success) {
            console.log('\n🎉 MongoDB connection successful!');
            console.log(`✅ Working configuration: ${testResult.config.name}`);
            
            // Test full connection and operations
            console.log('\n🔌 Testing full connection...');
            await mongoSSL.connectToMongoDB();
            
            console.log('\n📊 Initializing collections...');
            await mongoSSL.initializeCollections();
            
            console.log('\n🧪 Testing operations...');
            const operationsSuccess = await mongoSSL.testOperations();
            
            if (operationsSuccess) {
                console.log('\n🎉 All MongoDB tests passed!');
                console.log('✅ MongoDB Atlas is now working!');
            } else {
                console.log('\n⚠️ Connection works but operations failed');
            }
            
        } else {
            console.log('\n❌ No working MongoDB configuration found');
            console.log('💡 This indicates a deeper SSL/TLS issue');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    } finally {
        await mongoSSL.closeConnection();
    }
}

testMongoDBSSLFix();
