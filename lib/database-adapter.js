import * as mongoDB from './mongodb.js';

// Database adapter that provides the same interface as optimizedJsonDb
// but uses our universal MongoDB solution underneath

class DatabaseAdapter {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await mongoDB.connectToMongoDB();
            this.initialized = true;
        }
    }

    // User operations
    async getUserById(userId) {
        await this.initialize();
        return await mongoDB.getUserById(userId);
    }

    async getUserByEmail(email) {
        await this.initialize();
        return await mongoDB.getUserByEmail(email);
    }

    async createUser(userData) {
        await this.initialize();
        return await mongoDB.createUser(userData);
    }

    async updateUser(userId, updateData) {
        await this.initialize();
        return await mongoDB.updateUser(userId, updateData);
    }

    async deleteUser(userId) {
        await this.initialize();
        return await mongoDB.deleteUser(userId);
    }

    async getAllUsers() {
        await this.initialize();
        return await mongoDB.getAllUsers();
    }

    async getUsers(page = 1, limit = 10, search = '') {
        await this.initialize();
        return await mongoDB.getUsers(page, limit, search);
    }

    // Family operations
    async getFamilyById(familyId) {
        await this.initialize();
        return await mongoDB.getFamilyById(familyId);
    }

    async getAllFamilies() {
        await this.initialize();
        return await mongoDB.getAllFamilies();
    }

    async createFamily(familyData) {
        await this.initialize();
        return await mongoDB.createFamily(familyData);
    }

    async updateFamily(familyId, updateData) {
        await this.initialize();
        return await mongoDB.updateFamily(familyId, updateData);
    }

    async deleteFamily(familyId) {
        await this.initialize();
        return await mongoDB.deleteFamily(familyId);
    }

    // Member operations
    async getMemberById(memberId) {
        await this.initialize();
        return await mongoDB.getMemberById(memberId);
    }

    async getMemberByEmail(email) {
        await this.initialize();
        // Use getAllMembers and filter by email
        const allMembers = await mongoDB.getAllMembers();
        return allMembers.find(member => member.email === email) || null;
    }

    async getMembersByFamilyId(familyId) {
        await this.initialize();
        return await mongoDB.getMembersByFamilyId(familyId);
    }

    async getFamilyMembers(familyId) {
        return await this.getMembersByFamilyId(familyId);
    }

    async createMember(memberData) {
        await this.initialize();
        return await mongoDB.createMember(memberData);
    }

    async updateMember(memberId, updateData) {
        await this.initialize();
        return await mongoDB.updateMember(memberId, updateData);
    }

    async deleteMember(memberId) {
        await this.initialize();
        return await mongoDB.deleteMember(memberId);
    }

    async getAllMembers() {
        await this.initialize();
        return await mongoDB.getAllMembers();
    }

    async getMembers(page = 1, limit = 10, search = '') {
        await this.initialize();
        // Use getAllMembers and filter/search in memory for now
        // This can be optimized later with MongoDB queries
        const allMembers = await mongoDB.getAllMembers();
        let filtered = allMembers;
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = allMembers.filter(member => 
                (member.firstName && member.firstName.toLowerCase().includes(searchLower)) ||
                (member.lastName && member.lastName.toLowerCase().includes(searchLower)) ||
                (member.email && member.email.toLowerCase().includes(searchLower)) ||
                (member.phone && member.phone.includes(search))
            );
        }
        
        const skip = (page - 1) * limit;
        const data = filtered.slice(skip, skip + limit);
        
        return {
            data,
            pagination: {
                page,
                limit,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / limit)
            }
        };
    }

    // Price Plan operations
    async getPricePlansByFamilyId(familyId) {
        await this.initialize();
        return await mongoDB.getPricePlansByFamilyId(familyId);
    }

    async getPricePlanById(pricePlanId) {
        await this.initialize();
        // Use getPricePlansByFamilyId and search through all families
        // This is a stub - implement proper price plan lookup if you have a price plan collection
        const allPlans = await mongoDB.find('pricePlans', { id: pricePlanId });
        return allPlans && allPlans.length > 0 ? allPlans[0] : null;
    }

    async getPricePlans() {
        await this.initialize();
        return await mongoDB.find('pricePlans', {});
    }

    async createPricePlan(pricePlanData) {
        await this.initialize();
        return await mongoDB.createPricePlan(pricePlanData);
    }

    async updatePricePlan(pricePlanId, updateData) {
        await this.initialize();
        return await mongoDB.updateOne('pricePlans', { id: pricePlanId }, { $set: updateData });
    }

    async deletePricePlan(pricePlanId) {
        await this.initialize();
        return await mongoDB.deleteOne('pricePlans', { id: pricePlanId });
    }

    // Subscription operations
    async getSubscriptionsByFamilyId(familyId) {
        await this.initialize();
        return await mongoDB.getSubscriptionsByFamilyId(familyId);
    }

    async createSubscription(subscriptionData) {
        await this.initialize();
        return await mongoDB.createSubscription(subscriptionData);
    }

    // Statement operations
    async getStatementsByFamilyId(familyId) {
        await this.initialize();
        return await mongoDB.getStatementsByFamilyId(familyId);
    }

    async createStatement(statementData) {
        await this.initialize();
        return await mongoDB.createStatement(statementData);
    }

    // Activity operations
    async logActivity(activityData) {
        await this.initialize();
        return await mongoDB.logActivity(activityData);
    }

    async getActivitiesByFamilyId(familyId, limit = 50) {
        await this.initialize();
        return await mongoDB.getActivitiesByFamilyId(familyId, limit);
    }

    async getAllActivities() {
        await this.initialize();
        return await mongoDB.getAllActivities();
    }

    async getActivities(page = 1, limit = 20, userId = null) {
        await this.initialize();
        return await mongoDB.getActivities(page, limit, userId);
    }

    // Statement operations (additional methods)
    async getStatements() {
        await this.initialize();
        return await mongoDB.find('statements');
    }

    // Additional methods for compatibility
    async getFamilies() {
        return await this.getAllFamilies();
    }

    async getUserFamilies(userId) {
        // This would need to be implemented based on your user-family relationship
        // For now, returning all families (you can modify this logic)
        return await this.getAllFamilies();
    }

    async assignUserToFamily(userId, familyId, role) {
        // This would need to be implemented based on your user-family relationship
        // For now, just logging the activity
        await this.logActivity({
            userId: userId,
            type: 'user_assigned_to_family',
            description: `User ${userId} assigned to family ${familyId} as ${role}`,
            metadata: {
                familyId: familyId,
                role: role
            }
        });
        return { success: true };
    }

    // Session management (placeholder - implement as needed)
    async createSession(sessionData) {
        await this.initialize();
        return await mongoDB.insertOne('sessions', {
            ...sessionData,
            createdAt: new Date()
        });
    }

    async getSessionByToken(token) {
        await this.initialize();
        return await mongoDB.findOne('sessions', { sessionToken: token });
    }

    async deleteSession(token) {
        await this.initialize();
        return await mongoDB.deleteOne('sessions', { sessionToken: token });
    }

    // Children operations (stub methods - implement as needed)
    async getChildrenByParent(parentId) {
        await this.initialize();
        // Children might be stored as members with parentId or userId
        const members = await mongoDB.getAllMembers();
        if (Array.isArray(members)) {
            return members.filter(m => m.parentId === parentId || m.userId === parentId);
        }
        return [];
    }
    
    async createChild(childData) {
        await this.initialize();
        // Create child as a member
        return await this.createMember(childData);
    }
    
    async getMemberByEmail(email) {
        await this.initialize();
        return await mongoDB.findOne('members', { email });
    }

    async promoteChildToUser(childId) {
        await this.initialize();
        // Stub - implement child promotion logic
        return null;
    }

    async canChildHaveStatements(childId) {
        await this.initialize();
        // Stub - implement statement eligibility check
        return false;
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    // Database optimization
    async optimize() {
        await this.initialize();
        // Stub - implement optimization logic if needed
        return {
            sessionsRemoved: 0,
            tokensRemoved: 0,
            activitiesArchived: 0
        };
    }

    // Clear cache
    clearCache() {
        // Stub - implement cache clearing if needed
    }

    // Backup database
    async backup() {
        await this.initialize();
        // Stub - implement backup logic if needed
        return null;
    }

    // Get database statistics
    async getStats() {
        await this.initialize();
        // Stub - implement stats logic if needed
        return {
            totalUsers: 0,
            totalActivities: 0,
            totalSessions: 0,
            totalAccounts: 0,
            totalTokens: 0,
            totalPricePlans: 0,
            totalMembers: 0,
            totalSubscriptions: 0,
            totalStatements: 0
        };
    }

    // Check if user can access family
    async canUserAccessFamily(userId, familyId) {
        await this.initialize();
        const user = await this.getUserById(userId);
        if (!user) return false;
        // Super admin can access all families
        if (user.role === 'super_admin') return true;
        // Stub - implement family access check based on your data model
        return false;
    }

    // Database status
    getDatabaseStatus() {
        return mongoDB.getDatabaseStatus();
    }

    // Close connection
    async closeConnection() {
        await mongoDB.closeConnection();
    }
}

// Create and export a singleton instance
const db = new DatabaseAdapter();
export default db;
