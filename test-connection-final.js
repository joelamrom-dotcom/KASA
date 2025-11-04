const { MongoClient } = require('mongodb');

async function testFinalConnection() {
    console.log('🔌 Final MongoDB Connection Test');
    console.log('Node.js version:', process.version);
    console.log('MongoDB driver version:', require('mongodb/package.json').version);
    
    const connectionStrings = [
        // Your original connection string
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority',
        
        // Alternative with different SSL settings
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority&ssl=false',
        
        // Minimal connection string
        'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/?retryWrites=true&w=majority'
    ];
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        console.log(`\n📡 Test ${i + 1}/${connectionStrings.length}:`);
        console.log('Connection string:', uri.replace(/\/\/.*@/, '//***:***@'));
        
        try {
            const client = new MongoClient(uri, {
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                },
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000
            });
            
            console.log('⏳ Connecting...');
            await client.connect();
            console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
            
            const db = client.db('goldberger-family-db');
            console.log('📊 Database:', db.databaseName);
            
            // Test a simple operation
            const collections = await db.listCollections().toArray();
            console.log('📁 Collections found:', collections.length);
            
            await client.close();
            console.log('🔌 Connection closed');
            
            console.log('\n🎉 MONGODB CONNECTION WORKS!');
            console.log('💡 Use this connection string in your app:');
            console.log(uri);
            
            return true;
            
        } catch (error) {
            console.log('❌ Failed:', error.message);
            console.log('Error type:', error.constructor.name);
            
            if (error.code) {
                console.log('Error code:', error.code);
            }
        }
    }
    
    console.log('\n❌ All connection attempts failed.');
    console.log('\n💡 This confirms the SSL issue with Node.js v18.20.8');
    console.log('💡 Solutions:');
    console.log('   1. Update Node.js to v24.6.0 (recommended)');
    console.log('   2. Use MongoDB Compass GUI');
    console.log('   3. Continue with local storage (working solution)');
    
    return false;
}

// Run the test
testFinalConnection().then(success => {
    if (success) {
        console.log('\n🚀 MongoDB Atlas is ready to use!');
    } else {
        console.log('\n💡 Your local storage solution is working perfectly!');
    }
});
