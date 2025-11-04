const { MongoClient } = require('mongodb');

async function testMongoDBWindowsFix() {
    console.log('🔧 Testing Windows-specific MongoDB fixes...');
    console.log('Node.js version:', process.version);
    
    // Windows-specific connection attempts
    const connectionTests = [
        {
            name: 'Standard SRV',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {}
        },
        {
            name: 'Without SRV (Direct)',
            uri: 'mongodb://joelamrom:Joel%232003@cluster0joel-shard-00-00.bwr2yp0.mongodb.net:27017,cluster0joel-shard-00-01.bwr2yp0.mongodb.net:27017,cluster0joel-shard-00-02.bwr2yp0.mongodb.net:27017/goldberger-family-db?ssl=true&replicaSet=atlas-14b8sh-shard-0&authSource=admin&retryWrites=true&w=majority',
            options: {}
        },
        {
            name: 'With TLS 1.2 Force',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {
                tls: true,
                tlsInsecure: true,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            }
        },
        {
            name: 'With Legacy SSL',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {
                ssl: true,
                sslValidate: false,
                sslCA: null,
                serverSelectionTimeoutMS: 10000,
            }
        }
    ];
    
    for (const test of connectionTests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        try {
            const client = new MongoClient(test.uri, test.options);
            await client.connect();
            console.log(`✅ SUCCESS: ${test.name}`);
            
            const db = client.db('goldberger-family-db');
            console.log(`📊 Database: ${db.databaseName}`);
            
            await client.close();
            console.log(`🎉 MongoDB connection works with: ${test.name}`);
            return test;
            
        } catch (error) {
            console.log(`❌ FAILED: ${test.name}`);
            console.log(`   Error: ${error.message}`);
        }
    }
    
    console.log('\n💡 All Windows-specific fixes failed');
    console.log('💡 This is a known Windows SSL issue');
    console.log('💡 Solutions:');
    console.log('   1. Use MongoDB Compass (GUI tool)');
    console.log('   2. Use local MongoDB installation');
    console.log('   3. Use cloud-based MongoDB (MongoDB Atlas Data API)');
    console.log('   4. Continue with local JSON storage (working solution)');
    return null;
}

testMongoDBWindowsFix();

