const { MongoClient } = require('mongodb');

async function testMongoDBFix() {
    console.log('🔧 Testing different MongoDB connection fixes...');
    console.log('Node.js version:', process.version);
    
    // Test different connection strings and options
    const connectionTests = [
        {
            name: 'Standard Connection',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {}
        },
        {
            name: 'With TLS Options',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {
                tls: true,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true
            }
        },
        {
            name: 'With SSL Options',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {
                ssl: true,
                sslValidate: false
            }
        },
        {
            name: 'With Direct Connection',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority&directConnection=true',
            options: {}
        },
        {
            name: 'With Server API',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
            options: {
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false,
                }
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
            return test; // Found working configuration
            
        } catch (error) {
            console.log(`❌ FAILED: ${test.name} - ${error.message}`);
        }
    }
    
    console.log('\n💡 All connection attempts failed');
    console.log('💡 This might be a network/firewall issue');
    return null;
}

testMongoDBFix();

