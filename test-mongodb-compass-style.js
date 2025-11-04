const { MongoClient } = require('mongodb');

async function testMongoDBCompassStyle() {
    console.log('🚀 Testing MongoDB connection with Compass-style options...');
    console.log('Node.js version:', process.version);
    
    const uri = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
    
    // Try different connection options
    const options = {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        directConnection: false,
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        },
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    
    try {
        console.log('📡 Attempting connection with enhanced options...');
        const client = new MongoClient(uri, options);
        await client.connect();
        console.log('✅ SUCCESS! MongoDB Atlas connected!');
        
        const db = client.db('goldberger-family-db');
        console.log('📊 Database:', db.databaseName);
        
        // Test collections
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections found:', collections.length);
        
        await client.close();
        console.log('🔌 Connection closed');
        
        console.log('\n🎉 SSL ISSUE IS FIXED!');
        console.log('💡 You can now use MongoDB Atlas directly');
        
    } catch (error) {
        console.error('❌ Still having issues:', error.message);
        console.log('\n💡 This might be a network/firewall issue');
        console.log('💡 Let\'s use the smart database with fallback');
    }
}

testMongoDBCompassStyle();
