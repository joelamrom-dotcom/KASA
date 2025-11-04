const fs = require('fs').promises;
const path = require('path');

// Database file paths
const MAIN_DB = path.join(process.cwd(), 'data', 'database.json');
const FAMILY_CASE_DB = path.join(process.cwd(), 'data', 'family-case-db.json');

// Simple query engine for JSON databases
class JSONQueryEngine {
  constructor() {
    this.databases = {};
  }

  async loadDatabase(name, filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      this.databases[name] = JSON.parse(data);
      console.log(`✅ Loaded database: ${name}`);
    } catch (error) {
      console.log(`❌ Failed to load database: ${name} - ${error.message}`);
    }
  }

  async loadAllDatabases() {
    await this.loadDatabase('main', MAIN_DB);
    await this.loadDatabase('family_case', FAMILY_CASE_DB);
  }

  // Simple SELECT query
  select(table, conditions = {}) {
    if (!this.databases.main && !this.databases.family_case) {
      console.log('❌ No databases loaded. Run loadAllDatabases() first.');
      return [];
    }

    let data = [];
    
    // Check main database
    if (this.databases.main && this.databases.main[table]) {
      data = data.concat(this.databases.main[table]);
    }
    
    // Check family case database
    if (this.databases.family_case && this.databases.family_case[table]) {
      data = data.concat(this.databases.family_case[table]);
    }

    // Apply conditions (simple filtering)
    if (Object.keys(conditions).length > 0) {
      data = data.filter(item => {
        return Object.entries(conditions).every(([key, value]) => {
          if (typeof value === 'function') {
            return value(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    return data;
  }

  // Count records
  count(table, conditions = {}) {
    return this.select(table, conditions).length;
  }

  // Find by ID
  findById(table, id) {
    return this.select(table, { id });
  }

  // Find by email
  findByEmail(email) {
    return this.select('users', { email })[0];
  }

  // Get recent activities
  getRecentActivities(limit = 10) {
    const activities = this.select('activities');
    return activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Get users by role
  getUsersByRole(role) {
    return this.select('users', { role });
  }

  // Get active users
  getActiveUsers() {
    return this.select('users', { isActive: true });
  }

  // Get price plans
  getPricePlans() {
    return this.select('pricePlans');
  }

  // Get customers
  getCustomers() {
    return this.select('customers');
  }

  // Get statements
  getStatements() {
    return this.select('statements');
  }

  // Get income records
  getIncomeRecords() {
    return this.select('incomeRecords');
  }

  // Get calculations
  getCalculations() {
    return this.select('calculations');
  }

  // Database statistics
  getStats() {
    const stats = {
      users: this.count('users'),
      activeUsers: this.count('users', { isActive: true }),
      superAdmins: this.count('users', { role: 'super_admin' }),
      familyAdmins: this.count('users', { role: 'family_admin' }),
      members: this.count('users', { role: 'member' }),
      activities: this.count('activities'),
      customers: this.count('customers'),
      pricePlans: this.count('pricePlans'),
      statements: this.count('statements'),
      incomeRecords: this.count('incomeRecords'),
      calculations: this.count('calculations')
    };

    return stats;
  }
}

// Example usage functions
async function runQueries() {
  const db = new JSONQueryEngine();
  await db.loadAllDatabases();

  console.log('\n📊 DATABASE STATISTICS:');
  console.log('========================');
  const stats = db.getStats();
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n👥 USERS:');
  console.log('==========');
  const users = db.select('users');
  users.forEach(user => {
    console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
  });

  console.log('\n📈 RECENT ACTIVITIES:');
  console.log('=====================');
  const activities = db.getRecentActivities(5);
  activities.forEach(activity => {
    console.log(`- ${activity.description} (${new Date(activity.createdAt).toLocaleString()})`);
  });

  console.log('\n💰 PRICE PLANS:');
  console.log('===============');
  const pricePlans = db.getPricePlans();
  pricePlans.forEach(plan => {
    console.log(`- ${plan.title}: $${plan.yearlyPrice}/year ($${plan.monthlyPrice}/month)`);
  });

  console.log('\n👨‍👩‍👧‍👦 CUSTOMERS:');
  console.log('================');
  const customers = db.getCustomers();
  customers.forEach(customer => {
    console.log(`- ${customer.name} ${customer.familyName} (${customer.email})`);
  });

  console.log('\n📋 STATEMENTS:');
  console.log('===============');
  const statements = db.getStatements();
  statements.forEach(stmt => {
    console.log(`- ${stmt.description}: $${stmt.amount} (${stmt.status})`);
  });
}

// Export for use in other files
module.exports = { JSONQueryEngine, runQueries };

// Run if this file is executed directly
if (require.main === module) {
  runQueries().catch(console.error);
}
