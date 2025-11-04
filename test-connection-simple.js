const { MongoClient } = require('mongodb');

async function testSimpleConnection() {
    const uri = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
    
    console.log('🔌 Testing simple MongoDB connection...');
    console.log('URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    try {
        const client = new MongoClient(uri);
        console.log('📡 Attempting to connect...');
        
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        
        const db = client.db('goldberger-family-db');
        console.log('📊 Database:', db.databaseName);
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections:', collections.map(c => c.name));
        
        await client.close();
        console.log('🔌 Connection closed successfully');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error type:', error.constructor.name);
        
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

testSimpleConnection();
