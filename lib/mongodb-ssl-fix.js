import { MongoClient } from 'mongodb';

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
const DB_NAME = 'goldberger-family-db';

let client = null;
let db = null;

// Test different SSL configurations
async function testMongoDBConnection() {
    console.log('🔌 Testing MongoDB connection with SSL fixes...');
    
    const connectionOptions = [
        {
            name: 'Default (no SSL options)',
            options: {
                retryWrites: true,
                w: 'majority',
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            }
        },
        {
            name: 'SSL with TLS 1.2',
            options: {
                retryWrites: true,
                w: 'majority',
                ssl: true,
                tls: true,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true,
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            }
        },
        {
            name: 'Minimal SSL',
            options: {
                retryWrites: true,
                w: 'majority',
                tlsAllowInvalidCertificates: true,
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            }
        },
        {
            name: 'No SSL validation',
            options: {
                retryWrites: true,
                w: 'majority',
                ssl: false,
                tls: false,
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            }
        },
        {
            name: 'Alternative connection string',
            uri: 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true',
            options: {
                retryWrites: true,
                w: 'majority',
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            }
        }
    ];

    for (const config of connectionOptions) {
        try {
            console.log(`\n🔧 Testing: ${config.name}`);
            
            const testClient = new MongoClient(
                config.uri || MONGODB_URI, 
                {
                    ...config.options,
                    serverSelectionTimeoutMS: 10000,
                    connectTimeoutMS: 10000
                }
            );
            
            await testClient.connect();
            await testClient.close();
            
            console.log(`✅ SUCCESS: ${config.name} works!`);
            return { success: true, config };
            
        } catch (error) {
            console.log(`❌ FAILED: ${config.name} - ${error.message}`);
        }
    }
    
    console.log('\n❌ All connection attempts failed');
    return { success: false };
}

// Connect to MongoDB with the working configuration
async function connectToMongoDB() {
    try {
        if (client) {
            return db;
        }

        console.log('🔌 Attempting MongoDB connection...');
        
        // Test different configurations
        const testResult = await testMongoDBConnection();
        
        if (!testResult.success) {
            throw new Error('No working MongoDB configuration found');
        }

        // Use the working configuration
        const workingConfig = testResult.config;
        console.log(`🎯 Using configuration: ${workingConfig.name}`);
        
        client = new MongoClient(
            workingConfig.uri || MONGODB_URI, 
            workingConfig.options
        );

        await client.connect();
        console.log('✅ Connected to MongoDB Atlas successfully!');
        
        db = client.db(DB_NAME);
        return db;
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Get database instance
async function getDB() {
    if (!db) {
        await connectToMongoDB();
    }
    return db;
}

// Close connection
async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔌 MongoDB connection closed');
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
    connectToMongoDB,
    getDB,
    closeConnection,
    initializeCollections,
    testMongoDBConnection,
    testOperations
};
