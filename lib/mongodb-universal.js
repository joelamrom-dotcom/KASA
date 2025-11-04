import { MongoClient } from 'mongodb';
import MongoDBFallback from './mongodb-fallback.js';

// Connection strings
const MONGODB_ATLAS_URI = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/goldberger-family-db';
const DB_NAME = 'goldberger-family-db';

let client = null;
let db = null;
let useMongoDB = false;
let useLocalMongoDB = false;
let fallback = null;

// Test MongoDB Atlas connection
async function testMongoDBAtlas() {
    console.log('🔌 Testing MongoDB Atlas connection...');
    
    try {
        const testClient = new MongoClient(MONGODB_ATLAS_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true
        });
        
        await testClient.connect();
        await testClient.close();
        
        console.log('✅ MongoDB Atlas connection successful!');
        return true;
    } catch (error) {
        console.log('❌ MongoDB Atlas connection failed:', error.message);
        return false;
    }
}

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

// Initialize database connection with priority order
async function initializeDB() {
    if (fallback) return; // Already initialized
    
    console.log('🚀 Initializing database connection...\n');
    
    // Try MongoDB Atlas first
    const atlasAvailable = await testMongoDBAtlas();
    
    if (atlasAvailable) {
        try {
            client = new MongoClient(MONGODB_ATLAS_URI, {
                retryWrites: true,
                w: 'majority',
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true,
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            });
            
            await client.connect();
            db = client.db(DB_NAME);
            useMongoDB = true;
            useLocalMongoDB = false;
            console.log('🎉 Connected to MongoDB Atlas!');
            
            // Initialize collections
            await initializeCollections();
            return;
        } catch (error) {
            console.log('⚠️ MongoDB Atlas initialization failed, trying local MongoDB...');
        }
    }
    
    // Try local MongoDB second
    const localAvailable = await testLocalMongoDB();
    
    if (localAvailable) {
        try {
            client = new MongoClient(LOCAL_MONGODB_URI, {
                retryWrites: true,
                w: 'majority'
            });
            
            await client.connect();
            db = client.db(DB_NAME);
            useMongoDB = false;
            useLocalMongoDB = true;
            console.log('🎉 Connected to Local MongoDB!');
            
            // Initialize collections
            await initializeCollections();
            return;
        } catch (error) {
            console.log('⚠️ Local MongoDB initialization failed, using JSON fallback...');
        }
    }
    
    // Fallback to JSON storage
    fallback = new MongoDBFallback();
    useMongoDB = false;
    useLocalMongoDB = false;
    console.log('✅ Using JSON file storage (fallback mode)');
}

// Initialize collections
async function initializeCollections() {
    if (!useMongoDB && !useLocalMongoDB) return;
    
    const collections = [
        'families', 'members', 'pricePlans', 'subscriptions', 
        'statements', 'activities', 'users'
    ];

    for (const collectionName of collections) {
        try {
            await db.createCollection(collectionName);
            console.log(`✅ Collection '${collectionName}' created/verified`);
        } catch (error) {
            console.log(`ℹ️ Collection '${collectionName}' already exists`);
        }
    }
}

// Get database instance
async function getDB() {
    await initializeDB();
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

// Generic CRUD operations
async function insertOne(collectionName, document) {
    await initializeDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.insertOne(document);
    } else {
        return await fallback.insertOne(collectionName, document);
    }
}

async function find(collectionName, query = {}, options = {}) {
    await initializeDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.find(query, options).toArray();
    } else {
        return await fallback.find(collectionName, query, options);
    }
}

async function findOne(collectionName, query = {}) {
    await initializeDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.findOne(query);
    } else {
        return await fallback.findOne(collectionName, query);
    }
}

async function updateOne(collectionName, filter, update) {
    await initializeDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.updateOne(filter, update);
    } else {
        return await fallback.updateOne(collectionName, filter, update);
    }
}

async function deleteOne(collectionName, filter) {
    await initializeDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.deleteOne(filter);
    } else {
        return await fallback.deleteOne(collectionName, filter);
    }
}

// Family operations
async function createFamily(familyData) {
    return await insertOne('families', {
        ...familyData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

async function getAllFamilies() {
    return await find('families');
}

async function getFamilyById(id) {
    return await findOne('families', { id });
}

async function updateFamily(id, updateData) {
    return await updateOne('families', { id }, {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    });
}

async function deleteFamily(id) {
    return await deleteOne('families', { id });
}

// Member operations
async function createMember(memberData) {
    return await insertOne('members', {
        ...memberData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

async function getAllMembers() {
    return await find('members');
}

async function getMembersByFamilyId(familyId) {
    return await find('members', { familyId });
}

async function getMemberById(id) {
    return await findOne('members', { id });
}

async function updateMember(id, updateData) {
    return await updateOne('members', { id }, {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    });
}

async function deleteMember(id) {
    return await deleteOne('members', { id });
}

// User operations
async function createUser(userData) {
    return await insertOne('users', {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

async function getAllUsers() {
    return await find('users');
}

async function getUserByEmail(email) {
    return await findOne('users', { email });
}

async function getUserById(id) {
    return await findOne('users', { id });
}

async function updateUser(id, updateData) {
    return await updateOne('users', { id }, {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    });
}

async function deleteUser(id) {
    return await deleteOne('users', { id });
}

// Activity operations
async function createActivity(activityData) {
    return await insertOne('activities', {
        ...activityData,
        timestamp: new Date()
    });
}

async function getAllActivities() {
    return await find('activities', {}, { sort: { timestamp: -1 } });
}

// Get database status
function getDatabaseStatus() {
    let type = 'JSON File Storage';
    if (useMongoDB) type = 'MongoDB Atlas';
    if (useLocalMongoDB) type = 'Local MongoDB';
    
    return {
        usingMongoDB: useMongoDB,
        usingLocalMongoDB: useLocalMongoDB,
        connected: useMongoDB || useLocalMongoDB ? !!client : !!fallback,
        type: type
    };
}

export {
    initializeDB,
    getDB,
    closeConnection,
    insertOne,
    find,
    findOne,
    updateOne,
    deleteOne,
    createFamily,
    getAllFamilies,
    getFamilyById,
    updateFamily,
    deleteFamily,
    createMember,
    getAllMembers,
    getMembersByFamilyId,
    getMemberById,
    updateMember,
    deleteMember,
    createUser,
    getAllUsers,
    getUserByEmail,
    getUserById,
    updateUser,
    deleteUser,
    createActivity,
    getAllActivities,
    getDatabaseStatus
};
