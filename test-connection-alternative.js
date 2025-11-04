const { MongoClient } = require('mongodb');

async function testAlternativeConnection() {
    const uri = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
    
    console.log('🔌 Testing alternative MongoDB connection...');
    
    try {
        // Try with different SSL configurations
        const options = {
            ssl: false,
            tls: false,
            directConnection: false,
            retryWrites: true,
            w: 'majority'
        };
        
        console.log('📡 Attempting to connect with SSL disabled...');
        const client = new MongoClient(uri, options);
        
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        
        const db = client.db('goldberger-family-db');
        console.log('📊 Database:', db.databaseName);
        
        await client.close();
        console.log('🔌 Connection closed successfully');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        // Try another approach
        try {
            console.log('📡 Trying with minimal options...');
            const client2 = new MongoClient(uri, {});
            await client2.connect();
            console.log('✅ Successfully connected with minimal options!');
            await client2.close();
        } catch (error2) {
            console.error('❌ Minimal options also failed:', error2.message);
        }
    }
}

testAlternativeConnection();
