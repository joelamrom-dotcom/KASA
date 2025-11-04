const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Database file path
const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

// In-memory cache
class Cache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value) {
    // Implement LRU eviction
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.timestamps.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > CACHE_TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }
}

// Index management for faster queries
class IndexManager {
  constructor() {
    this.indexes = new Map();
  }

  buildIndexes(data) {
    // Email index for users
    const emailIndex = new Map();
    data.users.forEach(user => {
      emailIndex.set(user.email, user.id);
    });
    this.indexes.set('users_email', emailIndex);

    // User ID index for activities
    const userActivityIndex = new Map();
    data.activities.forEach(activity => {
      if (!userActivityIndex.has(activity.userId)) {
        userActivityIndex.set(activity.userId, []);
      }
      userActivityIndex.get(activity.userId).push(activity);
    });
    this.indexes.set('activities_userId', userActivityIndex);

    // Session token index
    const sessionIndex = new Map();
    data.sessions.forEach(session => {
      sessionIndex.set(session.sessionToken, session);
    });
    this.indexes.set('sessions_token', sessionIndex);

    // Member email index
    const memberEmailIndex = new Map();
    data.members?.forEach(member => {
      memberEmailIndex.set(member.email, member.id);
    });
    this.indexes.set('members_email', memberEmailIndex);

    // Member subscription index
    const memberSubscriptionIndex = new Map();
    data.subscriptions?.forEach(subscription => {
      if (!memberSubscriptionIndex.has(subscription.memberId)) {
        memberSubscriptionIndex.set(subscription.memberId, []);
      }
      memberSubscriptionIndex.get(subscription.memberId).push(subscription);
    });
    this.indexes.set('subscriptions_memberId', memberSubscriptionIndex);

    // Statement member index
    const statementMemberIndex = new Map();
    data.statements?.forEach(statement => {
      if (!statementMemberIndex.has(statement.memberId)) {
        statementMemberIndex.set(statement.memberId, []);
      }
      statementMemberIndex.get(statement.memberId).push(statement);
    });
    this.indexes.set('statements_memberId', statementMemberIndex);
  }

  getIndex(name) {
    return this.indexes.get(name);
  }

  updateIndex(name, key, value) {
    const index = this.indexes.get(name);
    if (index) {
      index.set(key, value);
    }
  }

  removeFromIndex(name, key) {
    const index = this.indexes.get(name);
    if (index) {
      index.delete(key);
    }
  }
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DB_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Initialize database
async function initDatabase() {
  const db = {
    users: [],
    activities: [],
    sessions: [],
    accounts: [],
    verificationTokens: [],
    pricePlans: [],
    members: [],
    subscriptions: [],
    statements: [],
    families: [],
    familyRoles: [], // Links users to families with roles
    children: [], // Children under users
    metadata: {
      version: '2.0',
      lastOptimized: new Date().toISOString(),
      totalRecords: 0
    }
  };
  
  await writeDatabase(db);
  return db;
}

// Read database with caching
const cache = new Cache();
const indexManager = new IndexManager();

async function readDatabase() {
  await ensureDataDir();
  
  // Check cache first
  const cached = cache.get('database');
  if (cached) {
    return cached;
  }

  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Build indexes
    indexManager.buildIndexes(parsed);
    
    // Cache the result
    cache.set('database', parsed);
    return parsed;
  } catch {
    await initDatabase();
    // Try to read again
    try {
      const data = await fs.readFile(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      indexManager.buildIndexes(parsed);
      cache.set('database', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to read database after initialization:', error);
      const fallback = {
        users: [],
        activities: [],
        sessions: [],
        accounts: [],
        verificationTokens: [],
        pricePlans: [],
        members: [],
        subscriptions: [],
        statements: [],
        metadata: {
          lastOptimized: new Date().toISOString(),
          totalUsers: 0,
          totalActivities: 0,
          totalMembers: 0,
          totalSubscriptions: 0,
          totalStatements: 0
        }
      };
      cache.set('database', fallback);
      return fallback;
    }
  }
}

// Write database with cache invalidation
async function writeDatabase(data) {
  await ensureDataDir();
  
  // Update metadata
  data.metadata = {
    lastOptimized: new Date().toISOString(),
    totalUsers: data.users.length,
    totalActivities: data.activities.length,
    totalMembers: data.members?.length || 0,
    totalSubscriptions: data.subscriptions?.length || 0,
    totalStatements: data.statements?.length || 0
  };
  
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  
  // Invalidate cache
  cache.invalidate('database');
  
  // Rebuild indexes
  indexManager.buildIndexes(data);
}

// Generate ID
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Pagination helper
function paginate(array, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
}

// Search helper
function search(array, query, fields) {
  if (!query) return array;
  
  const searchTerm = query.toLowerCase();
  return array.filter(item => 
    fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    })
  );
}

// Date helpers for billing
function getNextBillingDate(startDate, monthOffset = 0) {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(1); // Set to first of the month
  return date;
}

function generateMonthlyStatement(subscription, monthNumber) {
  const startDate = new Date(subscription.startDate);
  const billingDate = getNextBillingDate(startDate, monthNumber);
  const dueDate = new Date(billingDate);
  dueDate.setDate(dueDate.getDate() + 30); // Due 30 days after billing
  
  return {
    id: generateId(),
    memberId: subscription.memberId,
    subscriptionId: subscription.id,
    amount: subscription.monthlyAmount,
    billingDate: billingDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'pending', // pending, paid, overdue, cancelled
    description: `Monthly payment for ${subscription.pricePlanTitle} - Month ${monthNumber + 1}`,
    monthNumber: monthNumber + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Get last 10 activities for a member
async function getMemberRecentActivities(memberId, limit = 10) {
  const db = await readDatabase();
  const activities = db.activities || [];
  
  // Filter activities related to this member
  const memberActivities = activities.filter(activity => {
    // Check if activity is related to this member
    return activity.metadata?.memberId === memberId ||
           activity.description?.includes(`member ${memberId}`) ||
           activity.type?.includes('member') ||
           activity.type?.includes('payment') ||
           activity.type?.includes('statement');
  });
  
  // Sort by creation date (newest first) and limit
  return memberActivities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// Database operations
class OptimizedJsonDatabase {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await initDatabase();
      this.initialized = true;
    }
  }

  // User operations with pagination and search
  async getUsers(page = 1, limit = 10, searchQuery = '') {
    await this.init();
    const db = await readDatabase();
    
    let users = db.users;
    
    // Apply search if query provided
    if (searchQuery) {
      users = search(users, searchQuery, ['firstName', 'lastName', 'email', 'company']);
    }
    
    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return paginate(users, page, limit);
  }

  async getUserById(id) {
    await this.init();
    const db = await readDatabase();
    return db.users.find(user => user.id === id);
  }

  async getUserByEmail(email) {
    await this.init();
    const emailIndex = indexManager.getIndex('users_email');
    if (emailIndex && emailIndex.has(email)) {
      const userId = emailIndex.get(email);
      return this.getUserById(userId);
    }
    
    // Fallback to database search
    const db = await readDatabase();
    return db.users.find(user => user.email === email);
  }

  async createUser(userData) {
    await this.init();
    const db = await readDatabase();
    
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    await writeDatabase(db);
    
    // Update email index
    indexManager.updateIndex('users_email', newUser.email, newUser.id);
    
    return newUser;
  }

  async updateUser(id, updates) {
    await this.init();
    const db = await readDatabase();
    
    const userIndex = db.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    const oldEmail = db.users[userIndex].email;
    
    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await writeDatabase(db);
    
    // Update email index if email changed
    if (updates.email && updates.email !== oldEmail) {
      indexManager.removeFromIndex('users_email', oldEmail);
      indexManager.updateIndex('users_email', updates.email, id);
    }
    
    return db.users[userIndex];
  }

  async deleteUser(id) {
    await this.init();
    const db = await readDatabase();
    
    const userIndex = db.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    const user = db.users[userIndex];
    db.users.splice(userIndex, 1);
    await writeDatabase(db);
    
    // Remove from email index
    indexManager.removeFromIndex('users_email', user.email);
    
    return true;
  }

  // Price Plan operations
  async getPricePlans() {
    await this.init();
    const db = await readDatabase();
    return db.pricePlans || [];
  }

  async getPricePlanById(id) {
    await this.init();
    const db = await readDatabase();
    return (db.pricePlans || []).find(plan => plan.id === id);
  }

  async createPricePlan(planData) {
    await this.init();
    const db = await readDatabase();
    
    const newPlan = {
      id: generateId(),
      ...planData,
      monthlyPrice: planData.yearlyPrice / 12,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.pricePlans) db.pricePlans = [];
    db.pricePlans.push(newPlan);
    await writeDatabase(db);
    
    return newPlan;
  }

  async updatePricePlan(id, updates) {
    await this.init();
    const db = await readDatabase();
    
    const planIndex = db.pricePlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return null;
    
    db.pricePlans[planIndex] = {
      ...db.pricePlans[planIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await writeDatabase(db);
    return db.pricePlans[planIndex];
  }

  async deletePricePlan(id) {
    await this.init();
    const db = await readDatabase();
    
    const planIndex = db.pricePlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return false;
    
    db.pricePlans.splice(planIndex, 1);
    await writeDatabase(db);
    
    return true;
  }

  // Statement operations
  async getStatements() {
    await this.init();
    const db = await readDatabase();
    return db.statements || [];
  }

  // Family operations
  async getFamilies() {
    await this.init();
    const db = await readDatabase();
    return db.families || [];
  }

  async createFamily(familyData) {
    await this.init();
    const db = await readDatabase();
    
    const newFamily = {
      id: generateId(),
      ...familyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.families) db.families = [];
    db.families.push(newFamily);
    await writeDatabase(db);
    
    return newFamily;
  }

  // Family Role Management
  async assignUserToFamily(userId, familyId, role) {
    await this.init();
    const db = await readDatabase();
    
    if (!db.familyRoles) db.familyRoles = [];
    
    // Remove existing role for this user in this family
    db.familyRoles = db.familyRoles.filter(r => !(r.userId === userId && r.familyId === familyId));
    
    // Add new role
    const familyRole = {
      id: generateId(),
      userId,
      familyId,
      role, // 'admin', 'family_admin', 'member'
      createdAt: new Date().toISOString()
    };
    
    db.familyRoles.push(familyRole);
    await writeDatabase(db);
    
    return familyRole;
  }

  async getUserFamilies(userId) {
    await this.init();
    const db = await readDatabase();
    
    const userRoles = (db.familyRoles || []).filter(r => r.userId === userId);
    const families = (db.families || []).filter(f => 
      userRoles.some(r => r.familyId === f.id)
    );
    
    return families.map(family => ({
      ...family,
      role: userRoles.find(r => r.familyId === family.id)?.role
    }));
  }

  async getFamilyMembers(familyId) {
    await this.init();
    const db = await readDatabase();
    
    const familyRoles = (db.familyRoles || []).filter(r => r.familyId === familyId);
    const users = (db.users || []).filter(u => 
      familyRoles.some(r => r.userId === u.id)
    );
    
    return users.map(user => ({
      ...user,
      role: familyRoles.find(r => r.userId === user.id)?.role
    }));
  }

  async canUserAccessFamily(userId, familyId) {
    await this.init();
    const db = await readDatabase();
    
    // Super admin can access all families
    const user = await this.getUserById(userId);
    if (user?.role === 'super_admin') return true;
    
    // Check if user has role in this family
    const familyRole = (db.familyRoles || []).find(r => 
      r.userId === userId && r.familyId === familyId
    );
    
    return !!familyRole;
  }

  // Children Management
  async createChild(childData) {
    await this.init();
    const db = await readDatabase();
    
    const newChild = {
      id: generateId(),
      ...childData,
      status: 'child', // 'child' or 'user'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.children) db.children = [];
    db.children.push(newChild);
    await writeDatabase(db);
    
    return newChild;
  }

  async getChildrenByParent(parentId) {
    await this.init();
    const db = await readDatabase();
    
    return (db.children || []).filter(child => child.parentId === parentId);
  }

  async promoteChildToUser(childId) {
    await this.init();
    const db = await readDatabase();
    
    const childIndex = (db.children || []).findIndex(c => c.id === childId);
    if (childIndex === -1) return null;
    
    const child = db.children[childIndex];
    
    // Create new user from child
    const newUser = {
      id: generateId(),
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.email,
      phone: child.phone,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      role: 'member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add user to database
    if (!db.users) db.users = [];
    db.users.push(newUser);
    
    // Update child status
    db.children[childIndex].status = 'user';
    db.children[childIndex].userId = newUser.id;
    db.children[childIndex].updatedAt = new Date().toISOString();
    
    await writeDatabase(db);
    
    return newUser;
  }

  async canChildHaveStatements(childId) {
    await this.init();
    const db = await readDatabase();
    
    const child = (db.children || []).find(c => c.id === childId);
    if (!child) return false;
    
    // Check if child is 13+ and male
    const age = this.calculateAge(child.dateOfBirth);
    return age >= 13 && child.gender === 'male';
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Member operations
  async getMembers(page = 1, limit = 10, searchQuery = '') {
    await this.init();
    const db = await readDatabase();
    
    let members = db.members || [];
    
    // Apply search if query provided
    if (searchQuery) {
      members = search(members, searchQuery, ['firstName', 'lastName', 'email', 'phone']);
    }
    
    // Sort by creation date (newest first)
    members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return paginate(members, page, limit);
  }

  async getMemberById(id) {
    await this.init();
    const db = await readDatabase();
    return (db.members || []).find(member => member.id === id);
  }

  async getMemberByEmail(email) {
    await this.init();
    const memberEmailIndex = indexManager.getIndex('members_email');
    if (memberEmailIndex && memberEmailIndex.has(email)) {
      const memberId = memberEmailIndex.get(email);
      return this.getMemberById(memberId);
    }
    
    // Fallback to database search
    const db = await readDatabase();
    return (db.members || []).find(member => member.email === email);
  }

  async createMember(memberData) {
    await this.init();
    const db = await readDatabase();
    
    const newMember = {
      id: generateId(),
      ...memberData,
      balance: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.members) db.members = [];
    db.members.push(newMember);
    await writeDatabase(db);
    
    // Update email index
    indexManager.updateIndex('members_email', newMember.email, newMember.id);
    
    return newMember;
  }

  // Subscription operations
  async createSubscription(subscriptionData) {
    await this.init();
    const db = await readDatabase();
    
    const { memberId, pricePlanId, startDate } = subscriptionData;
    
    // Get price plan details
    const pricePlan = await this.getPricePlanById(pricePlanId);
    if (!pricePlan) {
      throw new Error('Price plan not found');
    }
    
    // Get member details
    const member = await this.getMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    
    const newSubscription = {
      id: generateId(),
      memberId,
      pricePlanId,
      pricePlanTitle: pricePlan.title,
      yearlyPrice: pricePlan.yearlyPrice,
      monthlyAmount: pricePlan.monthlyPrice,
      startDate: startDate || new Date().toISOString(),
      endDate: null, // Will be set when cancelled
      status: 'active', // active, cancelled, completed
      currentMonth: 1, // Track current month
      totalMonths: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.subscriptions) db.subscriptions = [];
    db.subscriptions.push(newSubscription);
    
    // Generate only the first month statement
    const firstStatement = generateMonthlyStatement(newSubscription, 0);
    if (!db.statements) db.statements = [];
    db.statements.push(firstStatement);
    
    await writeDatabase(db);
    
    // Update indexes
    const memberSubscriptionIndex = indexManager.getIndex('subscriptions_memberId');
    if (memberSubscriptionIndex) {
      if (!memberSubscriptionIndex.has(memberId)) {
        memberSubscriptionIndex.set(memberId, []);
      }
      memberSubscriptionIndex.get(memberId).push(newSubscription);
    }
    
    // Update statement indexes
    const statementMemberIndex = indexManager.getIndex('statements_memberId');
    if (statementMemberIndex) {
      if (!statementMemberIndex.has(memberId)) {
        statementMemberIndex.set(memberId, []);
      }
      statementMemberIndex.get(memberId).push(firstStatement);
    }
    
    return {
      subscription: newSubscription,
      statement: firstStatement
    };
  }

  // Generate next month statement
  async generateNextMonthStatement(subscriptionId) {
    await this.init();
    const db = await readDatabase();
    
    const subscriptionIndex = db.subscriptions.findIndex(sub => sub.id === subscriptionId);
    if (subscriptionIndex === -1) {
      throw new Error('Subscription not found');
    }
    
    const subscription = db.subscriptions[subscriptionIndex];
    
    // Check if we've reached the 12-month limit
    if (subscription.currentMonth >= subscription.totalMonths) {
      throw new Error('Subscription has reached maximum months');
    }
    
    // Generate next month statement
    const nextStatement = generateMonthlyStatement(subscription, subscription.currentMonth);
    db.statements.push(nextStatement);
    
    // Update subscription current month
    db.subscriptions[subscriptionIndex] = {
      ...subscription,
      currentMonth: subscription.currentMonth + 1,
      updatedAt: new Date().toISOString()
    };
    
    await writeDatabase(db);
    
    // Update statement indexes
    const statementMemberIndex = indexManager.getIndex('statements_memberId');
    if (statementMemberIndex) {
      if (!statementMemberIndex.has(subscription.memberId)) {
        statementMemberIndex.set(subscription.memberId, []);
      }
      statementMemberIndex.get(subscription.memberId).push(nextStatement);
    }
    
    return nextStatement;
  }

  // Get statement with recent activities
  async getStatementWithActivities(statementId) {
    await this.init();
    const db = await readDatabase();
    
    const statement = db.statements.find(stmt => stmt.id === statementId);
    if (!statement) {
      return null;
    }
    
    // Get recent activities for this member
    const recentActivities = await getMemberRecentActivities(statement.memberId, 10);
    
    return {
      ...statement,
      recentActivities
    };
  }

  // Get member statements with activities
  async getMemberStatementsWithActivities(memberId, page = 1, limit = 20) {
    await this.init();
    const db = await readDatabase();
    
    let statements = db.statements || [];
    
    // Filter by member
    if (memberId) {
      const statementMemberIndex = indexManager.getIndex('statements_memberId');
      if (statementMemberIndex && statementMemberIndex.has(memberId)) {
        statements = statementMemberIndex.get(memberId);
      } else {
        statements = statements.filter(statement => statement.memberId === memberId);
      }
    }
    
    // Sort by billing date (newest first)
    statements.sort((a, b) => new Date(b.billingDate) - new Date(a.billingDate));
    
    // Get recent activities for this member
    const recentActivities = await getMemberRecentActivities(memberId, 10);
    
    const paginated = paginate(statements, page, limit);
    
    return {
      ...paginated,
      recentActivities
    };
  }

  async getMemberSubscriptions(memberId) {
    await this.init();
    const memberSubscriptionIndex = indexManager.getIndex('subscriptions_memberId');
    if (memberSubscriptionIndex && memberSubscriptionIndex.has(memberId)) {
      return memberSubscriptionIndex.get(memberId);
    }
    
    // Fallback to database search
    const db = await readDatabase();
    return (db.subscriptions || []).filter(sub => sub.memberId === memberId);
  }

  // Statement operations
  async getMemberStatements(memberId, page = 1, limit = 20) {
    await this.init();
    const db = await readDatabase();
    
    let statements = db.statements || [];
    
    // Filter by member
    if (memberId) {
      const statementMemberIndex = indexManager.getIndex('statements_memberId');
      if (statementMemberIndex && statementMemberIndex.has(memberId)) {
        statements = statementMemberIndex.get(memberId);
      } else {
        statements = statements.filter(statement => statement.memberId === memberId);
      }
    }
    
    // Sort by billing date (newest first)
    statements.sort((a, b) => new Date(b.billingDate) - new Date(a.billingDate));
    
    return paginate(statements, page, limit);
  }

  async updateStatementStatus(statementId, status) {
    await this.init();
    const db = await readDatabase();
    
    const statementIndex = db.statements.findIndex(stmt => stmt.id === statementId);
    if (statementIndex === -1) return null;
    
    db.statements[statementIndex] = {
      ...db.statements[statementIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    await writeDatabase(db);
    return db.statements[statementIndex];
  }

  async payStatement(statementId, paymentAmount) {
    await this.init();
    const db = await readDatabase();
    
    const statementIndex = db.statements.findIndex(stmt => stmt.id === statementId);
    if (statementIndex === -1) return null;
    
    const statement = db.statements[statementIndex];
    const memberIndex = db.members.findIndex(member => member.id === statement.memberId);
    
    if (memberIndex === -1) return null;
    
    // Update statement
    db.statements[statementIndex] = {
      ...statement,
      status: 'paid',
      paidAmount: paymentAmount,
      paidDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update member balance
    const oldBalance = db.members[memberIndex].balance;
    db.members[memberIndex] = {
      ...db.members[memberIndex],
      balance: oldBalance + paymentAmount,
      updatedAt: new Date().toISOString()
    };
    
    // Log payment activity
    const paymentActivity = {
      id: generateId(),
      userId: null, // Will be set by API
      type: 'payment_received',
      description: `Payment received for statement ${statementId}`,
      metadata: {
        statementId,
        paymentAmount,
        memberId: statement.memberId,
        oldBalance,
        newBalance: oldBalance + paymentAmount,
        subscriptionId: statement.subscriptionId
      },
      createdAt: new Date().toISOString()
    };
    
    db.activities.push(paymentActivity);
    
    await writeDatabase(db);
    
    return {
      statement: db.statements[statementIndex],
      member: db.members[memberIndex],
      activity: paymentActivity
    };
  }

  // Activity operations with pagination
  async getActivities(page = 1, limit = 20, userId = null) {
    await this.init();
    const db = await readDatabase();
    
    let activities = db.activities;
    
    // Filter by user if specified
    if (userId) {
      const userActivityIndex = indexManager.getIndex('activities_userId');
      if (userActivityIndex && userActivityIndex.has(userId)) {
        activities = userActivityIndex.get(userId);
      } else {
        activities = activities.filter(activity => activity.userId === userId);
      }
    }
    
    // Sort by creation date (newest first)
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return paginate(activities, page, limit);
  }

  async getActivitiesByUserId(userId, page = 1, limit = 20) {
    return this.getActivities(page, limit, userId);
  }

  async logActivity(activityData) {
    await this.init();
    const db = await readDatabase();
    
    const newActivity = {
      id: generateId(),
      ...activityData,
      createdAt: new Date().toISOString()
    };
    
    db.activities.push(newActivity);
    await writeDatabase(db);
    
    // Update user activity index
    if (newActivity.userId) {
      const userActivityIndex = indexManager.getIndex('activities_userId');
      if (userActivityIndex) {
        if (!userActivityIndex.has(newActivity.userId)) {
          userActivityIndex.set(newActivity.userId, []);
        }
        userActivityIndex.get(newActivity.userId).push(newActivity);
      }
    }
    
    return newActivity;
  }

  // Session operations with index optimization
  async getSession(sessionToken) {
    await this.init();
    const sessionIndex = indexManager.getIndex('sessions_token');
    if (sessionIndex && sessionIndex.has(sessionToken)) {
      return sessionIndex.get(sessionToken);
    }
    
    // Fallback to database search
    const db = await readDatabase();
    return db.sessions.find(session => session.sessionToken === sessionToken);
  }

  async createSession(sessionData) {
    await this.init();
    const db = await readDatabase();
    
    const newSession = {
      id: generateId(),
      ...sessionData
    };
    
    db.sessions.push(newSession);
    await writeDatabase(db);
    
    // Update session index
    indexManager.updateIndex('sessions_token', newSession.sessionToken, newSession);
    
    return newSession;
  }

  async deleteSession(sessionToken) {
    await this.init();
    const db = await readDatabase();
    
    const sessionIndex = db.sessions.findIndex(session => session.sessionToken === sessionToken);
    if (sessionIndex === -1) return false;
    
    db.sessions.splice(sessionIndex, 1);
    await writeDatabase(db);
    
    // Remove from session index
    indexManager.removeFromIndex('sessions_token', sessionToken);
    
    return true;
  }

  // Account operations
  async getAccount(provider, providerAccountId) {
    await this.init();
    const db = await readDatabase();
    return db.accounts.find(account => 
      account.provider === provider && 
      account.providerAccountId === providerAccountId
    );
  }

  async createAccount(accountData) {
    await this.init();
    const db = await readDatabase();
    
    const newAccount = {
      id: generateId(),
      ...accountData
    };
    
    db.accounts.push(newAccount);
    await writeDatabase(db);
    return newAccount;
  }

  // Verification token operations
  async getVerificationToken(identifier, token) {
    await this.init();
    const db = await readDatabase();
    return db.verificationTokens.find(vt => 
      vt.identifier === identifier && vt.token === token
    );
  }

  async createVerificationToken(tokenData) {
    await this.init();
    const db = await readDatabase();
    
    const newToken = {
      ...tokenData
    };
    
    db.verificationTokens.push(newToken);
    await writeDatabase(db);
    return newToken;
  }

  async deleteVerificationToken(identifier, token) {
    await this.init();
    const db = await readDatabase();
    
    db.verificationTokens = db.verificationTokens.filter(vt => 
      !(vt.identifier === identifier && vt.token === token)
    );
    await writeDatabase(db);
  }

  // Database optimization and cleanup
  async optimize() {
    await this.init();
    const db = await readDatabase();
    const now = new Date();
    
    // Remove expired sessions
    const originalSessionCount = db.sessions.length;
    db.sessions = db.sessions.filter(session => 
      new Date(session.expires) > now
    );
    
    // Remove expired verification tokens
    const originalTokenCount = db.verificationTokens.length;
    db.verificationTokens = db.verificationTokens.filter(token => 
      new Date(token.expires) > now
    );
    
    // Archive old activities (keep last 1000)
    if (db.activities.length > 1000) {
      db.activities = db.activities
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 1000);
    }
    
    // Archive old statements (keep last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (db.statements) {
      const originalStatementCount = db.statements.length;
      db.statements = db.statements.filter(statement => 
        new Date(statement.billingDate) > twoYearsAgo
      );
    }
    
    await writeDatabase(db);
    
    return {
      sessionsRemoved: originalSessionCount - db.sessions.length,
      tokensRemoved: originalTokenCount - db.verificationTokens.length,
      activitiesArchived: originalSessionCount + originalTokenCount - db.sessions.length - db.verificationTokens.length
    };
  }

  // Get database statistics
  async getStats() {
    await this.init();
    const db = await readDatabase();
    
    return {
      totalUsers: db.users.length,
      totalActivities: db.activities.length,
      totalSessions: db.sessions.length,
      totalAccounts: db.accounts.length,
      totalTokens: db.verificationTokens.length,
      totalPricePlans: db.pricePlans?.length || 0,
      totalMembers: db.members?.length || 0,
      totalSubscriptions: db.subscriptions?.length || 0,
      totalStatements: db.statements?.length || 0,
      lastOptimized: db.metadata?.lastOptimized,
      cacheSize: cache.cache.size
    };
  }

  // Clear cache
  clearCache() {
    cache.clear();
  }

  // Backup database
  async backup() {
    await this.init();
    const db = await readDatabase();
    const backupPath = DB_FILE.replace('.json', `_backup_${Date.now()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(db, null, 2));
    return backupPath;
  }

  // Get all subscriptions
  async getAllSubscriptions() {
    await this.init();
    const db = await readDatabase();
    return db.subscriptions || [];
  }
}

module.exports = new OptimizedJsonDatabase();
