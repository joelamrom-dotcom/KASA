const { MongoClient } = require('mongodb');

const connectionString = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';

async function testConnection(options, description) {
    console.log(`\n🔌 Testing: ${description}`);
    console.log('Options:', JSON.stringify(options, null, 2));
    
    try {
        const client = new MongoClient(connectionString, options);
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.close();
        return true;
    } catch (error) {
        console.log('❌ FAILED:', error.message);
        return false;
    }
}

async function testAllSSLConfigurations() {
    console.log('🚀 Testing all SSL configurations...\n');
    
    const configurations = [
        {
            options: {},
            description: 'Default (no options)'
        },
        {
            options: {
                ssl: true,
                tls: true
            },
            description: 'SSL and TLS enabled'
        },
        {
            options: {
                ssl: false,
                tls: false
            },
            description: 'SSL and TLS disabled'
        },
        {
            options: {
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true
            },
            description: 'Allow invalid certificates'
        },
        {
            options: {
                ssl: true,
                tls: true,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true
            },
            description: 'SSL with invalid certs allowed'
        },
        {
            options: {
                directConnection: false,
                retryWrites: true,
                w: 'majority'
            },
            description: 'Minimal options'
        },
        {
            options: {
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            },
            description: 'Server API options'
        }
    ];
    
    let successCount = 0;
    
    for (const config of configurations) {
        const success = await testConnection(config.options, config.description);
        if (success) successCount++;
    }
    
    console.log(`\n📊 Results: ${successCount}/${configurations.length} configurations worked`);
    
    if (successCount === 0) {
        console.log('\n💡 All configurations failed. This suggests:');
        console.log('   1. Update Node.js to latest version');
        console.log('   2. Check your network/firewall');
        console.log('   3. Try connecting from a different network');
        console.log('   4. Use MongoDB Compass to test connection');
    }
}

// Run the tests
testAllSSLConfigurations();
