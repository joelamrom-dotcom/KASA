// MongoDB Fallback Configuration
// This file provides alternative approaches when direct SSL connection fails

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback to local JSON storage when MongoDB connection fails
class MongoDBFallback {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
        } catch (error) {
            console.log('Data directory already exists');
        }
    }

    async getCollection(collectionName) {
        const filePath = path.join(this.dataPath, `${collectionName}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return empty array
            return [];
        }
    }

    async saveCollection(collectionName, data) {
        const filePath = path.join(this.dataPath, `${collectionName}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    // Family operations
    async getAllFamilies() {
        return await this.getCollection('families');
    }

    async getFamilyById(familyId) {
        const families = await this.getCollection('families');
        return families.find(f => f.id === familyId);
    }

    async createFamily(familyData) {
        const families = await this.getCollection('families');
        const newFamily = {
            ...familyData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        families.push(newFamily);
        await this.saveCollection('families', families);
        return { insertedId: newFamily._id };
    }

    async updateFamily(familyId, updateData) {
        const families = await this.getCollection('families');
        const index = families.findIndex(f => f.id === familyId);
        if (index !== -1) {
            families[index] = {
                ...families[index],
                ...updateData,
                updatedAt: new Date()
            };
            await this.saveCollection('families', families);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async deleteFamily(familyId) {
        const families = await this.getCollection('families');
        const filtered = families.filter(f => f.id !== familyId);
        await this.saveCollection('families', filtered);
        
        // Also delete related data
        await this.deleteMany('members', { familyId });
        await this.deleteMany('pricePlans', { familyId });
        await this.deleteMany('subscriptions', { familyId });
        await this.deleteMany('statements', { familyId });
        await this.deleteMany('activities', { familyId });
        
        return { deletedCount: families.length - filtered.length };
    }

    // Member operations
    async getMembersByFamilyId(familyId) {
        const members = await this.getCollection('members');
        return members.filter(m => m.familyId === familyId);
    }

    async getMemberById(memberId) {
        const members = await this.getCollection('members');
        return members.find(m => m.id === memberId);
    }

    async createMember(memberData) {
        const members = await this.getCollection('members');
        const newMember = {
            ...memberData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        members.push(newMember);
        await this.saveCollection('members', members);
        return { insertedId: newMember._id };
    }

    async updateMember(memberId, updateData) {
        const members = await this.getCollection('members');
        const index = members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            members[index] = {
                ...members[index],
                ...updateData,
                updatedAt: new Date()
            };
            await this.saveCollection('members', members);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async deleteMember(memberId) {
        const members = await this.getCollection('members');
        const filtered = members.filter(m => m.id !== memberId);
        await this.saveCollection('members', filtered);
        
        // Also delete related data
        await this.deleteMany('subscriptions', { memberId });
        await this.deleteMany('statements', { memberId });
        
        return { deletedCount: members.length - filtered.length };
    }

    // Price Plan operations
    async getPricePlansByFamilyId(familyId) {
        const plans = await this.getCollection('pricePlans');
        return plans.filter(p => p.familyId === familyId);
    }

    async createPricePlan(pricePlanData) {
        const plans = await this.getCollection('pricePlans');
        const newPlan = {
            ...pricePlanData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        plans.push(newPlan);
        await this.saveCollection('pricePlans', plans);
        return { insertedId: newPlan._id };
    }

    // Subscription operations
    async getSubscriptionsByFamilyId(familyId) {
        const subscriptions = await this.getCollection('subscriptions');
        return subscriptions.filter(s => s.familyId === familyId);
    }

    async createSubscription(subscriptionData) {
        const subscriptions = await this.getCollection('subscriptions');
        const newSubscription = {
            ...subscriptionData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        subscriptions.push(newSubscription);
        await this.saveCollection('subscriptions', subscriptions);
        return { insertedId: newSubscription._id };
    }

    // Statement operations
    async getStatementsByFamilyId(familyId) {
        const statements = await this.getCollection('statements');
        return statements.filter(s => s.familyId === familyId);
    }

    async createStatement(statementData) {
        const statements = await this.getCollection('statements');
        const newStatement = {
            ...statementData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        statements.push(newStatement);
        await this.saveCollection('statements', statements);
        return { insertedId: newStatement._id };
    }

    // Activity operations
    async logActivity(activityData) {
        const activities = await this.getCollection('activities');
        const newActivity = {
            ...activityData,
            _id: Date.now().toString(),
            timestamp: new Date()
        };
        activities.push(newActivity);
        await this.saveCollection('activities', activities);
        return { insertedId: newActivity._id };
    }

    async getActivitiesByFamilyId(familyId, limit = 50) {
        const activities = await this.getCollection('activities');
        return activities
            .filter(a => a.familyId === familyId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Utility operations
    async deleteMany(collectionName, filter) {
        const collection = await this.getCollection(collectionName);
        const keys = Object.keys(filter);
        const filtered = collection.filter(item => {
            return !keys.every(key => item[key] === filter[key]);
        });
        await this.saveCollection(collectionName, filtered);
        return { deletedCount: collection.length - filtered.length };
    }

    async find(collectionName, query = {}) {
        const collection = await this.getCollection(collectionName);
        if (Object.keys(query).length === 0) {
            return collection;
        }
        
        return collection.filter(item => {
            // Separate $or conditions from other conditions
            const hasOrCondition = query.$or !== undefined;
            const orConditions = query.$or;
            const otherConditions = Object.keys(query).filter(key => key !== '$or');
            
            // Check $or condition if it exists
            let orMatches = true; // Default to true if no $or condition
            if (hasOrCondition && Array.isArray(orConditions)) {
                orMatches = orConditions.some(condition => {
                    return Object.keys(condition).every(key => {
                        const value = condition[key];
                        if (value && typeof value === 'object' && value.$regex) {
                            const regex = new RegExp(value.$regex, value.$options || '');
                            return regex.test(item[key] || '');
                        }
                        return item[key] === value;
                    });
                });
            }
            
            // Check other conditions (AND logic)
            const otherConditionsMatch = otherConditions.length === 0 || otherConditions.every(key => {
                const value = query[key];
                if (value && typeof value === 'object' && value.$regex) {
                    const regex = new RegExp(value.$regex, value.$options || '');
                    return regex.test(item[key] || '');
                }
                return item[key] === value;
            });
            
            // Return true only if BOTH $or (if present) AND other conditions match
            return orMatches && otherConditionsMatch;
        });
    }

    async findOne(collectionName, query = {}) {
        const results = await this.find(collectionName, query);
        return results[0] || null;
    }

    async countDocuments(collectionName, filter = {}) {
        const results = await this.find(collectionName, filter);
        return results.length;
    }

    // User operations
    async createUser(userData) {
        const users = await this.getCollection('users');
        const newUser = {
            ...userData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        users.push(newUser);
        await this.saveCollection('users', users);
        return { insertedId: newUser._id };
    }

    async getAllUsers() {
        return await this.getCollection('users');
    }

    async getUserByEmail(email) {
        const users = await this.getCollection('users');
        return users.find(u => u.email === email);
    }

    async updateUser(id, updateData) {
        const users = await this.getCollection('users');
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = {
                ...users[index],
                ...updateData,
                updatedAt: new Date()
            };
            await this.saveCollection('users', users);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async deleteUser(id) {
        const users = await this.getCollection('users');
        const filtered = users.filter(u => u.id !== id);
        await this.saveCollection('users', filtered);
        return { deletedCount: users.length - filtered.length };
    }

    // Price Plan operations
    async createPricePlan(planData) {
        const plans = await this.getCollection('pricePlans');
        const newPlan = {
            ...planData,
            _id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        plans.push(newPlan);
        await this.saveCollection('pricePlans', plans);
        return { insertedId: newPlan._id };
    }

    // Generic operations for hybrid compatibility
    async insertOne(collectionName, document) {
        switch (collectionName) {
            case 'families':
                return await this.createFamily(document);
            case 'members':
                return await this.createMember(document);
            case 'users':
                return await this.createUser(document);
            case 'activities':
                return await this.logActivity(document);
            case 'pricePlans':
                return await this.createPricePlan(document);
            case 'subscriptions':
                return await this.createSubscription(document);
            case 'statements':
                return await this.createStatement(document);
            default:
                throw new Error(`Unknown collection: ${collectionName}`);
        }
    }

    async updateOne(collectionName, filter, update) {
        const collection = await this.getCollection(collectionName);
        const keys = Object.keys(filter);
        const index = collection.findIndex(item => 
            keys.every(key => item[key] === filter[key])
        );
        
        if (index !== -1) {
            collection[index] = {
                ...collection[index],
                ...update.$set,
                updatedAt: new Date()
            };
            await this.saveCollection(collectionName, collection);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async deleteOne(collectionName, filter) {
        const collection = await this.getCollection(collectionName);
        const keys = Object.keys(filter);
        const filtered = collection.filter(item => 
            !keys.every(key => item[key] === filter[key])
        );
        await this.saveCollection(collectionName, filtered);
        return { deletedCount: collection.length - filtered.length };
    }
}

// Export the fallback class
export default MongoDBFallback;
