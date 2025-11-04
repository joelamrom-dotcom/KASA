const { MongoClient } = require('mongodb');

async function testAfterNodeUpdate() {
    console.log('🚀 Testing MongoDB connection after Node.js update...');
    console.log('Node.js version:', process.version);
    
    const uri = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
    
    try {
        console.log('📡 Attempting connection...');
        const client = new MongoClient(uri);
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
        console.log('💡 Your smart database will automatically use MongoDB');
        
    } catch (error) {
        console.error('❌ Still having issues:', error.message);
        console.log('\n💡 Try restarting your terminal');
    }
}

testAfterNodeUpdate();


