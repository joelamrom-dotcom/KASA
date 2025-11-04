const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://joelamrom:Joel%232003@cluster0joel.bwr2yp0.mongodb.net/goldberger-family-db?retryWrites=true&w=majority';
const DB_NAME = 'goldberger-family-db';

let client = null;
let db = null;

// Connect to MongoDB with SSL fixes
async function connectToMongoDB() {
    try {
        if (client) {
            return db;
        }

        // Connection options with SSL fixes
        const options = {
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
            retryWrites: true,
            w: 'majority',
            serverApi: {
                version: '1',
                strict: false,
                deprecationErrors: false
            }
        };

        client = new MongoClient(MONGODB_URI, options);

        await client.connect();
        console.log('✅ Connected to MongoDB Atlas with SSL fixes');
        
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
    
    // Create collections if they don't exist
    const collections = [
        'families',
        'members', 
        'pricePlans',
        'subscriptions',
        'statements',
        'activities',
        'users'
    ];

    for (const collectionName of collections) {
        try {
            await database.createCollection(collectionName);
            console.log(`✅ Collection '${collectionName}' created/verified`);
        } catch (error) {
            // Collection might already exist
            console.log(`ℹ️ Collection '${collectionName}' already exists`);
        }
    }
}

// Utility functions for common operations
async function insertOne(collectionName, document) {
    const database = await getDB();
    const collection = database.collection(collectionName);
    return await collection.insertOne(document);
}

async function find(collectionName, query = {}, options = {}) {
    const database = await getDB();
    const collection = database.collection(collectionName);
    return await collection.find(query, options).toArray();
}

async function findOne(collectionName, query = {}) {
    const database = await getDB();
    const collection = database.collection(collectionName);
    return await collection.findOne(query);
}

async function updateOne(collectionName, filter, update) {
    const database = await getDB();
    const collection = database.collection(collectionName);
    return await collection.updateOne(filter, update);
}

async function deleteOne(collectionName, filter) {
    const database = await getDB();
    const collection = database.collection(collectionName);
    return await collection.deleteOne(filter);
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

async function updateMember(id, updateData) {
    return await updateOne('members', { id }, {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    });
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

async function updateUser(id, updateData) {
    return await updateOne('users', { id }, {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    });
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

module.exports = {
    connectToMongoDB,
    getDB,
    closeConnection,
    initializeCollections,
    insertOne,
    find,
    findOne,
    updateOne,
    deleteOne,
    createFamily,
    getAllFamilies,
    getFamilyById,
    updateFamily,
    createMember,
    getAllMembers,
    getMembersByFamilyId,
    updateMember,
    createUser,
    getAllUsers,
    getUserByEmail,
    updateUser,
    createActivity,
    getAllActivities
};
