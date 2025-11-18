const { MongoClient } = require('mongodb');
const MongoDBFallback = require('./mongodb-fallback');

class SmartDatabase {
    constructor() {
        this.mongoClient = null;
        this.fallback = new MongoDBFallback();
        this.useMongoDB = false;
        this.connectionString = process.env.MONGODB_URI || '';
        if (!this.connectionString) {
            throw new Error('MONGODB_URI environment variable is required');
        }
    }

    async initialize() {
        try {
            console.log('🔌 Attempting MongoDB connection...');
            this.mongoClient = new MongoClient(this.connectionString);
            await this.mongoClient.connect();
            console.log('✅ MongoDB connected successfully!');
            this.useMongoDB = true;
            
            // Initialize collections
            const db = this.mongoClient.db('goldberger-family-db');
            const collections = ['families', 'members', 'pricePlans', 'subscriptions', 'statements', 'activities', 'users'];
            
            for (const collectionName of collections) {
                try {
                    await db.createCollection(collectionName);
                    console.log(`✅ Collection '${collectionName}' ready`);
                } catch (error) {
                    console.log(`ℹ️ Collection '${collectionName}' already exists`);
                }
            }
            
        } catch (error) {
            console.log('⚠️ MongoDB connection failed, using local storage fallback');
            console.log('Error:', error.message);
            this.useMongoDB = false;
        }
    }

    async getDB() {
        if (this.useMongoDB && this.mongoClient) {
            return this.mongoClient.db('goldberger-family-db');
        }
        return null;
    }

    async close() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log('🔌 MongoDB connection closed');
        }
    }

    // Family operations
    async getAllFamilies() {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('families');
            return await collection.find({}).toArray();
        } else {
            return await this.fallback.getAllFamilies();
        }
    }

    async getFamilyById(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('families');
            return await collection.findOne({ id: familyId });
        } else {
            return await this.fallback.getFamilyById(familyId);
        }
    }

    async createFamily(familyData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('families');
            const result = await collection.insertOne({
                ...familyData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } else {
            return await this.fallback.createFamily(familyData);
        }
    }

    async updateFamily(familyId, updateData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('families');
            return await collection.updateOne(
                { id: familyId },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                }
            );
        } else {
            return await this.fallback.updateFamily(familyId, updateData);
        }
    }

    async deleteFamily(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('families');
            await collection.deleteOne({ id: familyId });
            
            // Delete related data
            await db.collection('members').deleteMany({ familyId });
            await db.collection('pricePlans').deleteMany({ familyId });
            await db.collection('subscriptions').deleteMany({ familyId });
            await db.collection('statements').deleteMany({ familyId });
            await db.collection('activities').deleteMany({ familyId });
            
            return { deletedCount: 1 };
        } else {
            return await this.fallback.deleteFamily(familyId);
        }
    }

    // Member operations
    async getMembersByFamilyId(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('members');
            return await collection.find({ familyId }).toArray();
        } else {
            return await this.fallback.getMembersByFamilyId(familyId);
        }
    }

    async getMemberById(memberId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('members');
            return await collection.findOne({ id: memberId });
        } else {
            return await this.fallback.getMemberById(memberId);
        }
    }

    async createMember(memberData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('members');
            const result = await collection.insertOne({
                ...memberData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } else {
            return await this.fallback.createMember(memberData);
        }
    }

    async updateMember(memberId, updateData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('members');
            return await collection.updateOne(
                { id: memberId },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                }
            );
        } else {
            return await this.fallback.updateMember(memberId, updateData);
        }
    }

    async deleteMember(memberId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('members');
            await collection.deleteOne({ id: memberId });
            
            // Delete related data
            await db.collection('subscriptions').deleteMany({ memberId });
            await db.collection('statements').deleteMany({ memberId });
            
            return { deletedCount: 1 };
        } else {
            return await this.fallback.deleteMember(memberId);
        }
    }

    // Price Plan operations
    async getPricePlansByFamilyId(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('pricePlans');
            return await collection.find({ familyId }).toArray();
        } else {
            return await this.fallback.getPricePlansByFamilyId(familyId);
        }
    }

    async createPricePlan(pricePlanData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('pricePlans');
            const result = await collection.insertOne({
                ...pricePlanData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } else {
            return await this.fallback.createPricePlan(pricePlanData);
        }
    }

    // Subscription operations
    async getSubscriptionsByFamilyId(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('subscriptions');
            return await collection.find({ familyId }).toArray();
        } else {
            return await this.fallback.getSubscriptionsByFamilyId(familyId);
        }
    }

    async createSubscription(subscriptionData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('subscriptions');
            const result = await collection.insertOne({
                ...subscriptionData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } else {
            return await this.fallback.createSubscription(subscriptionData);
        }
    }

    // Statement operations
    async getStatementsByFamilyId(familyId) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('statements');
            return await collection.find({ familyId }).toArray();
        } else {
            return await this.fallback.getStatementsByFamilyId(familyId);
        }
    }

    async createStatement(statementData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('statements');
            const result = await collection.insertOne({
                ...statementData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } else {
            return await this.fallback.createStatement(statementData);
        }
    }

    // Activity operations
    async logActivity(activityData) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('activities');
            const result = await collection.insertOne({
                ...activityData,
                timestamp: new Date()
            });
            return result;
        } else {
            return await this.fallback.logActivity(activityData);
        }
    }

    async getActivitiesByFamilyId(familyId, limit = 50) {
        if (this.useMongoDB) {
            const db = await this.getDB();
            const collection = db.collection('activities');
            return await collection.find({ familyId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
        } else {
            return await this.fallback.getActivitiesByFamilyId(familyId, limit);
        }
    }

    // Utility methods
    isUsingMongoDB() {
        return this.useMongoDB;
    }

    getConnectionStatus() {
        return {
            usingMongoDB: this.useMongoDB,
            status: this.useMongoDB ? 'Connected to MongoDB Atlas' : 'Using local storage fallback'
        };
    }
}

// Create and export a singleton instance
const smartDB = new SmartDatabase();

module.exports = smartDB;
