const { MongoClient } = require('mongodb');

async function testMongoDBCompassStyle() {
    console.log('🔌 Testing MongoDB connection (Compass-style)...');
    console.log('Node.js version:', process.version);
    
    // Try different connection approaches
    const connectionStrings = [
        // Standard connection
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
        
        // With explicit SSL settings
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority&ssl=true&tls=true',
        
        // With different SSL mode
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority&ssl=false',
        
        // Minimal connection string
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/?retryWrites=true&w=majority'
    ];
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        console.log(`\n📡 Testing connection ${i + 1}/${connectionStrings.length}...`);
        
        try {
            const client = new MongoClient(uri, {
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            });
            
            await client.connect();
            console.log('✅ SUCCESS!');
            
            const db = client.db('goldberger-family-db');
            console.log('📊 Database:', db.databaseName);
            
            await client.close();
            console.log('🔌 Connection closed');
            
            console.log('\n🎉 MongoDB connection works!');
            console.log('💡 Use this connection string in your app:');
            console.log(uri);
            return;
            
        } catch (error) {
            console.log('❌ Failed:', error.message.substring(0, 100) + '...');
        }
    }
    
    console.log('\n❌ All connection attempts failed.');
    console.log('\n💡 Solutions:');
    console.log('   1. Update Node.js to v24.6.0 (recommended)');
    console.log('   2. Use MongoDB Compass GUI to test connection');
    console.log('   3. Check your network/firewall settings');
    console.log('   4. Try connecting from a different network');
}

testMongoDBCompassStyle();
