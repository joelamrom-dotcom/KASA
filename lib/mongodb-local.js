import { MongoClient } from 'mongodb';

// Local MongoDB connection (no SSL issues)
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/goldberger-family-db';
const DB_NAME = 'goldberger-family-db';

let client = null;
let db = null;

// Test local MongoDB connection
async function testLocalMongoDB() {
    console.log('🔌 Testing Local MongoDB connection...');
    
    try {
        const testClient = new MongoClient(LOCAL_MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        await testClient.connect();
        await testClient.close();
        
        console.log('✅ Local MongoDB connection successful!');
        return true;
    } catch (error) {
        console.log('❌ Local MongoDB not available:', error.message);
        return false;
    }
}

// Connect to local MongoDB
async function connectToLocalMongoDB() {
    try {
        if (client) {
            return db;
        }

        console.log('🔌 Connecting to Local MongoDB...');
        
        client = new MongoClient(LOCAL_MONGODB_URI, {
            retryWrites: true,
            w: 'majority'
        });

        await client.connect();
        console.log('✅ Connected to Local MongoDB successfully!');
        
        db = client.db(DB_NAME);
        return db;
        
    } catch (error) {
        console.error('❌ Local MongoDB connection error:', error);
        throw error;
    }
}

// Get database instance
async function getDB() {
    if (!db) {
        await connectToLocalMongoDB();
    }
    return db;
}

// Close connection
async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔌 Local MongoDB connection closed');
    }
}

// Initialize collections
async function initializeCollections() {
    const database = await getDB();
    
    const collections = [
        'families', 'members', 'pricePlans', 'subscriptions', 
        'statements', 'activities', 'users'
    ];

    for (const collectionName of collections) {
        try {
            await database.createCollection(collectionName);
            console.log(`✅ Collection '${collectionName}' created/verified`);
        } catch (error) {
            console.log(`ℹ️ Collection '${collectionName}' already exists`);
        }
    }
}

// Test basic operations
async function testOperations() {
    try {
        const database = await getDB();
        const collection = database.collection('test');
        
        // Test insert
        const result = await collection.insertOne({ test: 'connection', timestamp: new Date() });
        console.log('✅ Insert test passed:', result.insertedId);
        
        // Test find
        const docs = await collection.find({}).toArray();
        console.log('✅ Find test passed:', docs.length, 'documents');
        
        // Clean up
        await collection.deleteOne({ _id: result.insertedId });
        console.log('✅ Delete test passed');
        
        return true;
    } catch (error) {
        console.error('❌ Operation test failed:', error);
        return false;
    }
}

export {
    testLocalMongoDB,
    connectToLocalMongoDB,
    getDB,
    closeConnection,
    initializeCollections,
    testOperations
};
