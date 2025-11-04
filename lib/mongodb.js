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
    try {
        const testClient = new MongoClient(MONGODB_ATLAS_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true
        });
        
        await testClient.connect();
        await testClient.close();
        return true;
    } catch (error) {
        return false;
    }
}

// Test local MongoDB connection
async function testLocalMongoDB() {
    try {
        const testClient = new MongoClient(LOCAL_MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        await testClient.connect();
        await testClient.close();
        return true;
    } catch (error) {
        return false;
    }
}

// Initialize database connection with priority order
async function connectToMongoDB() {
    if (fallback) return; // Already initialized
    
    console.log('🚀 Initializing database connection...');
    
    // Try MongoDB Atlas first with timeout
    try {
        const atlasAvailable = await Promise.race([
            testMongoDBAtlas(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Atlas test timeout')), 3000))
        ]);
        
        if (atlasAvailable) {
            try {
                client = new MongoClient(MONGODB_ATLAS_URI, {
                    retryWrites: true,
                    w: 'majority',
                    serverSelectionTimeoutMS: 3000, // 3 second timeout
                    connectTimeoutMS: 3000,
                    tlsAllowInvalidCertificates: true,
                    tlsAllowInvalidHostnames: true,
                    serverApi: {
                        version: '1',
                        strict: false,
                        deprecationErrors: false
                    }
                });
                
                // Connect with timeout
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
                ]);
                
                db = client.db(DB_NAME);
                useMongoDB = true;
                useLocalMongoDB = false;
                console.log('🎉 Connected to MongoDB Atlas!');
                
                // Initialize collections with timeout
                await Promise.race([
                    initializeCollections(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 2000))
                ]).catch(() => console.log('⚠️ Collection initialization skipped due to timeout'));
                return;
            } catch (error) {
                console.log('⚠️ MongoDB Atlas initialization failed:', error.message);
                if (client) {
                    try { await client.close(); } catch (e) {}
                    client = null;
                }
            }
        }
    } catch (error) {
        console.log('⚠️ MongoDB Atlas test failed:', error.message);
    }
    
    // Try local MongoDB second with timeout
    try {
        const localAvailable = await Promise.race([
            testLocalMongoDB(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Local test timeout')), 2000))
        ]);
        
        if (localAvailable) {
            try {
                client = new MongoClient(LOCAL_MONGODB_URI, {
                    retryWrites: true,
                    w: 'majority',
                    serverSelectionTimeoutMS: 2000,
                    connectTimeoutMS: 2000
                });
                
                // Connect with timeout
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
                ]);
                
                db = client.db(DB_NAME);
                useMongoDB = false;
                useLocalMongoDB = true;
                console.log('🎉 Connected to Local MongoDB!');
                
                // Initialize collections with timeout
                await Promise.race([
                    initializeCollections(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 2000))
                ]).catch(() => console.log('⚠️ Collection initialization skipped due to timeout'));
                return;
            } catch (error) {
                console.log('⚠️ Local MongoDB initialization failed:', error.message);
                if (client) {
                    try { await client.close(); } catch (e) {}
                    client = null;
                }
            }
        }
    } catch (error) {
        console.log('⚠️ Local MongoDB test failed:', error.message);
    }
    
    // Fallback to JSON storage - this should be instant
    try {
        const MongoDBFallback = (await import('./mongodb-fallback.js')).default;
        fallback = new MongoDBFallback();
        useMongoDB = false;
        useLocalMongoDB = false;
        console.log('✅ Using JSON file storage (fallback mode)');
    } catch (error) {
        console.error('❌ Failed to initialize fallback storage:', error);
        throw error;
    }
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
    await connectToMongoDB();
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
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.insertOne(document);
    } else {
        return await fallback.insertOne(collectionName, document);
    }
}

async function find(collectionName, query = {}, options = {}) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.find(query, options).toArray();
    } else {
        return await fallback.find(collectionName, query, options);
    }
}

async function findOne(collectionName, query = {}) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.findOne(query);
    } else {
        return await fallback.findOne(collectionName, query);
    }
}

async function updateOne(collectionName, filter, update, options = {}) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.updateOne(filter, update, options);
    } else {
        return await fallback.updateOne(collectionName, filter, update);
    }
}

async function updateMany(collectionName, filter, update, options = {}) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.updateMany(filter, update, options);
    } else {
        // Fallback doesn't support updateMany, so we'll use updateOne
        return await fallback.updateOne(collectionName, filter, update);
    }
}

async function deleteOne(collectionName, filter) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.deleteOne(filter);
    } else {
        return await fallback.deleteOne(collectionName, filter);
    }
}

async function deleteMany(collectionName, filter) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.deleteMany(filter);
    } else {
        // Fallback doesn't support deleteMany, so we'll use deleteOne
        return await fallback.deleteOne(collectionName, filter);
    }
}

async function countDocuments(collectionName, filter = {}) {
    await connectToMongoDB();
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection(collectionName);
        return await collection.countDocuments(filter);
    } else {
        const results = await fallback.find(collectionName, filter);
        return results.length;
    }
}

// Family-specific operations
async function getFamilyById(familyId) {
    return await findOne('families', { id: familyId });
}

async function getAllFamilies() {
    return await find('families');
}

async function createFamily(familyData) {
    return await insertOne('families', {
        ...familyData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

async function updateFamily(familyId, updateData) {
    return await updateOne('families', 
        { id: familyId }, 
        { 
            $set: { 
                ...updateData, 
                updatedAt: new Date() 
            } 
        }
    );
}

async function deleteFamily(familyId) {
    // Delete family and all related data
    await deleteOne('families', { id: familyId });
    await deleteMany('members', { familyId });
    await deleteMany('pricePlans', { familyId });
    await deleteMany('subscriptions', { familyId });
    await deleteMany('statements', { familyId });
    await deleteMany('activities', { familyId });
}

// Member-specific operations
async function getMembersByFamilyId(familyId) {
    return await find('members', { familyId });
}

async function getMemberById(memberId) {
    return await findOne('members', { id: memberId });
}

async function createMember(memberData) {
    return await insertOne('members', {
        ...memberData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

async function updateMember(memberId, updateData) {
    return await updateOne('members',
        { id: memberId },
        {
            $set: {
                ...updateData,
                updatedAt: new Date()
            }
        }
    );
}

async function deleteMember(memberId) {
    // Delete member and related data
    await deleteOne('members', { id: memberId });
    await deleteMany('subscriptions', { memberId });
    await deleteMany('statements', { memberId });
}

async function getAllMembers() {
    return await find('members');
}

// Price Plan operations
async function getPricePlansByFamilyId(familyId) {
    return await find('pricePlans', { familyId });
}

async function createPricePlan(pricePlanData) {
    return await insertOne('pricePlans', {
        ...pricePlanData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

// Subscription operations
async function getSubscriptionsByFamilyId(familyId) {
    return await find('subscriptions', { familyId });
}

async function createSubscription(subscriptionData) {
    return await insertOne('subscriptions', {
        ...subscriptionData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

// Statement operations
async function getStatementsByFamilyId(familyId) {
    return await find('statements', { familyId });
}

async function createStatement(statementData) {
    return await insertOne('statements', {
        ...statementData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

// User operations
async function getUserById(userId) {
    if (!userId) return null;
    
    // Try to find by id first
    let user = await findOne('users', { id: userId });
    
    // If not found and using MongoDB, try _id
    if (!user && (useMongoDB || useLocalMongoDB)) {
        await connectToMongoDB();
        try {
            // MongoDB ObjectId format check
            if (userId.match(/^[0-9a-fA-F]{24}$/)) {
                const { ObjectId } = await import('mongodb');
                user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            } else {
                user = await db.collection('users').findOne({ _id: userId });
            }
        } catch (error) {
            // If _id lookup fails, try id field
            user = await db.collection('users').findOne({ id: userId });
        }
    }
    
    // If still not found in fallback, try _id
    if (!user && fallback) {
        user = await fallback.findOne('users', { _id: userId }) || 
               await fallback.findOne('users', { id: userId });
    }
    
    return user;
}

async function getUserByEmail(email) {
    return await findOne('users', { email });
}

async function getAllUsers() {
    return await find('users');
}

async function getUsers(page = 1, limit = 10, search = '') {
    // Connect to database (now has built-in timeouts)
    try {
        await connectToMongoDB();
    } catch (error) {
        console.log('⚠️ Database connection error, using fallback:', error.message);
        // Continue with fallback if connection fails
    }
    
    let query = {};
    if (search) {
        query = {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ]
        };
    }
    
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection('users');
        const skip = (page - 1) * limit;
        const data = await collection.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        const total = await collection.countDocuments(query);
        
        return {
            data: data.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } else {
        // Use fallback storage
        if (!fallback) {
            const MongoDBFallback = (await import('./mongodb-fallback.js')).default;
            fallback = new MongoDBFallback();
        }
        
        try {
            const allUsers = await fallback.find('users', query);
            const skip = (page - 1) * limit;
            const data = allUsers
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(skip, skip + limit)
                .map(user => {
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                });
            
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total: allUsers.length,
                    totalPages: Math.ceil(allUsers.length / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching users from fallback:', error);
            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            };
        }
    }
}

async function createUser(userData) {
    const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        ...userData,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const result = await insertOne('users', newUser);
    return { ...newUser, _id: result.insertedId };
}

async function updateUser(userId, updateData) {
    // Try to find user first to determine ID format
    let user = await findOne('users', { id: userId });
    if (!user && (useMongoDB || useLocalMongoDB)) {
        await connectToMongoDB();
        try {
            if (userId.match(/^[0-9a-fA-F]{24}$/)) {
                const { ObjectId } = await import('mongodb');
                user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            } else {
                user = await db.collection('users').findOne({ _id: userId }) || 
                       await db.collection('users').findOne({ id: userId });
            }
        } catch (error) {
            user = await db.collection('users').findOne({ id: userId });
        }
    }
    
    // Build query based on what we found
    let query = {};
    if (user && user._id) {
        query = { _id: user._id };
    } else if (user && user.id) {
        query = { id: user.id };
    } else {
        query = { id: userId };
    }
    
    return await updateOne('users',
        query,
        {
            $set: {
                ...updateData,
                updatedAt: new Date().toISOString()
            }
        }
    );
}

async function deleteUser(userId) {
    return await deleteOne('users', { id: userId });
}

// Activity logging
async function logActivity(activityData) {
    const newActivity = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        ...activityData,
        createdAt: new Date().toISOString(),
        timestamp: new Date()
    };
    
    return await insertOne('activities', newActivity);
}

async function getAllActivities() {
    return await find('activities');
}

async function getActivities(page = 1, limit = 20, userId = null) {
    // Connect to database (now has built-in timeouts)
    try {
        await connectToMongoDB();
    } catch (error) {
        console.log('⚠️ Database connection error, using fallback:', error.message);
        // Continue with fallback if connection fails
    }
    
    let query = {};
    if (userId) {
        query.userId = userId;
    }
    
    if (useMongoDB || useLocalMongoDB) {
        try {
            const collection = db.collection('activities');
            const skip = (page - 1) * limit;
            const data = await collection.find(query)
                .sort({ createdAt: -1, timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            const total = await collection.countDocuments(query);
            
            return {
                activities: data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching activities from MongoDB:', error);
            // Fall through to fallback
        }
    }
    
    // Use fallback storage
    if (!fallback) {
        try {
            const MongoDBFallback = (await import('./mongodb-fallback.js')).default;
            fallback = new MongoDBFallback();
        } catch (error) {
            console.error('Failed to initialize fallback:', error);
            return {
                activities: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            };
        }
    }
    
    try {
        const allActivities = await fallback.find('activities', query);
        const skip = (page - 1) * limit;
        const data = allActivities
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp || 0);
                const dateB = new Date(b.createdAt || b.timestamp || 0);
                return dateB - dateA;
            })
            .slice(skip, skip + limit);
        
        return {
            activities: data,
            pagination: {
                page,
                limit,
                total: allActivities.length,
                totalPages: Math.ceil(allActivities.length / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching activities from fallback:', error);
        return {
            activities: [],
            pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0
            }
        };
    }
}

async function getActivitiesByFamilyId(familyId, limit = 50) {
    if (useMongoDB || useLocalMongoDB) {
        const collection = db.collection('activities');
        return await collection.find({ familyId })
            .sort({ timestamp: -1, createdAt: -1 })
            .limit(limit)
            .toArray();
    } else {
        const activities = await fallback.find('activities', { familyId });
        return activities
            .sort((a, b) => {
                const dateA = new Date(a.timestamp || a.createdAt || 0);
                const dateB = new Date(b.timestamp || b.createdAt || 0);
                return dateB - dateA;
            })
            .slice(0, limit);
    }
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
    connectToMongoDB,
    getDB,
    closeConnection,
    initializeCollections,
    insertOne,
    find,
    findOne,
    updateOne,
    updateMany,
    deleteOne,
    deleteMany,
    countDocuments,
    // User operations
    getUserById,
    getUserByEmail,
    getAllUsers,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    // Family operations
    getFamilyById,
    getAllFamilies,
    createFamily,
    updateFamily,
    deleteFamily,
    // Member operations
    getMembersByFamilyId,
    getMemberById,
    getAllMembers,
    createMember,
    updateMember,
    deleteMember,
    // Price Plan operations
    getPricePlansByFamilyId,
    createPricePlan,
    // Subscription operations
    getSubscriptionsByFamilyId,
    createSubscription,
    // Statement operations
    getStatementsByFamilyId,
    createStatement,
    // Activity operations
    logActivity,
    getAllActivities,
    getActivities,
    getActivitiesByFamilyId,
    getDatabaseStatus
};
