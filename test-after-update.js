const { MongoClient } = require('mongodb');

async function testAfterUpdate() {
    console.log('🚀 Testing MongoDB connection after Node.js update...');
    console.log('Node.js version:', process.version);
    
    const uri = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
    
    try {
        console.log('📡 Attempting connection...');
        const client = new MongoClient(uri);
        await client.connect();
        console.log('✅ SUCCESS! MongoDB connected!');
        
        const db = client.db('goldberger-family-db');
        console.log('📊 Database:', db.databaseName);
        
        await client.close();
        console.log('🔌 Connection closed');
        
        console.log('\n🎉 SSL issue is FIXED!');
        console.log('💡 You can now use MongoDB Atlas directly');
        
    } catch (error) {
        console.error('❌ Still having issues:', error.message);
        console.log('\n💡 Try these additional steps:');
        console.log('   1. Restart your computer');
        console.log('   2. Check Windows Firewall');
        console.log('   3. Try a different network');
        console.log('   4. Use MongoDB Compass to test');
    }
}

testAfterUpdate();
