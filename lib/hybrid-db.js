import { MongoClient } from 'mongodb';
import MongoDBFallback from './mongodb-fallback.js';

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
const DB_NAME = 'goldberger-family-db';

let client = null;
let db = null;
let useMongoDB = false;
let fallback = null;

// Test MongoDB connection
async function testMongoDBConnection() {
    try {
        const testClient = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        await testClient.connect();
        await testClient.close();
        return true;
    } catch (error) {
        console.log('⚠️ MongoDB connection failed, using JSON fallback');
        return false;
    }
}

// Initialize database connection
async function initializeDB() {
    if (fallback) return; // Already initialized
    
    const mongoAvailable = await testMongoDBConnection();
    
    if (mongoAvailable) {
        try {
            client = new MongoClient(MONGODB_URI, {
                retryWrites: true,
                w: 'majority',
                serverApi: {
                    version: '1',
                    strict: false,
                    deprecationErrors: false
                }
            });
            
            await client.connect();
            db = client.db(DB_NAME);
            useMongoDB = true;
            console.log('✅ Connected to MongoDB Atlas');
            
            // Initialize collections
            await initializeCollections();
        } catch (error) {
            console.log('⚠️ MongoDB initialization failed, using JSON fallback');
            useMongoDB = false;
        }
    }
    
    if (!useMongoDB) {
        fallback = new MongoDBFallback();
        console.log('✅ Using JSON file storage');
    }
}

// Initialize collections
async function initializeCollections() {
    if (!useMongoDB) return;
    
    const collections = [
        'families', 'members', 'pricePlans', 'subscriptions', 
        'statements', 'activities', 'users'
    ];

    for (const collectionName of collections) {
        try {
            await db.createCollection(collectionName);
        } catch (error) {
            // Collection might already exist
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
    
    if (useMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.insertOne(document);
    } else {
        return await fallback.insertOne(collectionName, document);
    }
}

async function find(collectionName, query = {}, options = {}) {
    await initializeDB();
    
    if (useMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.find(query, options).toArray();
    } else {
        return await fallback.find(collectionName, query, options);
    }
}

async function findOne(collectionName, query = {}) {
    await initializeDB();
    
    if (useMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.findOne(query);
    } else {
        return await fallback.findOne(collectionName, query);
    }
}

async function updateOne(collectionName, filter, update) {
    await initializeDB();
    
    if (useMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.updateOne(filter, update);
    } else {
        return await fallback.updateOne(collectionName, filter, update);
    }
}

async function deleteOne(collectionName, filter) {
    await initializeDB();
    
    if (useMongoDB) {
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
    return {
        usingMongoDB: useMongoDB,
        connected: useMongoDB ? !!client : !!fallback,
        type: useMongoDB ? 'MongoDB Atlas' : 'JSON File Storage'
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
