// MongoDB API Client for Goldberger Family Dashboard
class GoldbergerAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // Set authentication token
    setToken(token, user) {
        this.token = token;
        this.currentUser = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Make authenticated API request
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.clearAuth();
                window.location.reload();
                return null;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        try {
            console.log('🔐 Attempting login with:', email);
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (response) {
                this.setToken(response.token, response.user);
                console.log('✅ Login successful for:', response.user.firstName, response.user.lastName);
            }
            
            return response;
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            throw error;
        }
    }

    // Initialize default data
    async initData() {
        return await this.makeRequest('/init-data', {
            method: 'POST'
        });
    }

    // Family operations
    async getFamily() {
        return await this.makeRequest('/family');
    }

    async updateFamily(data) {
        return await this.makeRequest('/family', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Members operations
    async getMembers() {
        return await this.makeRequest('/members');
    }

    async createMember(data) {
        return await this.makeRequest('/members', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateMember(id, data) {
        return await this.makeRequest(`/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteMember(id) {
        return await this.makeRequest(`/members/${id}`, {
            method: 'DELETE'
        });
    }

    // Pricing plans operations
    async getPricingPlans() {
        return await this.makeRequest('/pricing-plans');
    }

    async createPricingPlan(data) {
        return await this.makeRequest('/pricing-plans', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePricingPlan(id, data) {
        return await this.makeRequest(`/pricing-plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deletePricingPlan(id) {
        return await this.makeRequest(`/pricing-plans/${id}`, {
            method: 'DELETE'
        });
    }

    // Subscriptions operations
    async getSubscriptions() {
        return await this.makeRequest('/subscriptions');
    }

    async createSubscription(data) {
        return await this.makeRequest('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateSubscription(id, data) {
        return await this.makeRequest(`/subscriptions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteSubscription(id) {
        return await this.makeRequest(`/subscriptions/${id}`, {
            method: 'DELETE'
        });
    }

    // Statements operations
    async getStatements() {
        return await this.makeRequest('/statements');
    }

    async generateNextMonthStatements() {
        return await this.makeRequest('/statements/generate-next-month', {
            method: 'POST'
        });
    }

    async updateStatement(id, data) {
        return await this.makeRequest(`/statements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteStatement(id) {
        return await this.makeRequest(`/statements/${id}`, {
            method: 'DELETE'
        });
    }

    // Activities
    async getActivities() {
        return await this.makeRequest('/activities');
    }

    // Dashboard stats
    async getDashboardStats() {
        return await this.makeRequest('/dashboard/stats');
    }
}

// Global API instance
const api = new GoldbergerAPI();

// Normalize MongoDB data to match frontend expectations
function normalizeMongoData(data) {
    if (Array.isArray(data)) {
        return data.map(item => normalizeMongoData(item));
    } else if (data && typeof data === 'object') {
        const normalized = { ...data };
        // Convert _id to id for compatibility
        if (normalized._id && !normalized.id) {
            normalized.id = normalized._id;
        }
        // Recursively normalize nested objects
        for (const key in normalized) {
            if (normalized[key] && typeof normalized[key] === 'object') {
                normalized[key] = normalizeMongoData(normalized[key]);
            }
        }
        return normalized;
    }
    return data;
}

// Get ID safely (works with both _id and id)
function getItemId(item) {
    return item._id || item.id;
}

// Enhanced login function
async function loginWithMongoDB() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        console.log('🔐 Attempting MongoDB login...');
        const response = await api.login(email, password);
        
        if (response) {
            // Hide login, show main app
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';
            
            // Update user info in sidebar
            updateUserInfo();
            
            // Refresh display
            await refreshDisplayFromMongoDB();
            showSection('overview');
            
            console.log(`👤 Logged in as: ${response.user.firstName} ${response.user.lastName} (${response.user.role})`);
        }
    } catch (error) {
        console.error('❌ MongoDB login failed:', error);
        alert(error.message || 'Login failed. Please check your credentials.');
    }
}

// Enhanced logout function
function logoutFromMongoDB() {
    api.clearAuth();
    
    // Show login, hide main app
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Clear form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    console.log('👋 Logged out');
}

// Refresh display from MongoDB
async function refreshDisplayFromMongoDB() {
    try {
        console.log('🔄 Refreshing display from MongoDB...');
        
        // Load all data from MongoDB
        const family = await api.getFamily();
        const members = await api.getMembers();
        const subscriptions = await api.getSubscriptions();
        const pricingPlans = await api.getPricingPlans();
        const statements = await api.getStatements();
        
        // Normalize MongoDB data to match frontend expectations
        const normalizedFamily = normalizeMongoData(family);
        const normalizedMembers = normalizeMongoData(members);
        const normalizedSubscriptions = normalizeMongoData(subscriptions);
        const normalizedPricingPlans = normalizeMongoData(pricingPlans);
        const normalizedStatements = normalizeMongoData(statements);
        
        // Update global data
        familyData = {
            family: normalizedFamily,
            members: normalizedMembers,
            subscriptions: normalizedSubscriptions,
            pricePlans: normalizedPricingPlans,
            statements: normalizedStatements
        };
        
        // Update all displays
        await Promise.all([
            updateStatsFromMongoDB(),
            updateQuickActions(),
            displayFamilyInfoFromMongoDB(),
            displayMembersFromMongoDB(),
            displaySubscriptionsFromMongoDB(),
            displayStatementsFromMongoDB(),
            displayPricingPlansFromMongoDB(),
            displayActivitiesFromMongoDB()
        ]);
        
        console.log('✅ Display refreshed from MongoDB');
        console.log('📊 Data loaded:', {
            family: family ? 'Yes' : 'No',
            members: members.length,
            subscriptions: subscriptions.length,
            pricingPlans: pricingPlans.length,
            statements: statements.length
        });
    } catch (error) {
        console.error('❌ Error refreshing display:', error);
        alert('Error loading data: ' + error.message);
    }
}

// Update stats from MongoDB
async function updateStatsFromMongoDB() {
    try {
        const stats = await api.getDashboardStats();
        
        document.getElementById('totalMembers').textContent = stats.totalMembers;
        document.getElementById('activeSubscriptions').textContent = stats.activeSubscriptions;
        document.getElementById('totalStatements').textContent = stats.totalStatements;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue}`;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Display family info from MongoDB
async function displayFamilyInfoFromMongoDB() {
    try {
        const family = await api.getFamily();
        
        document.getElementById('familyInfo').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Family Name</strong></td>
                        <td>${family.name}</td>
                    </tr>
                    <tr>
                        <td><strong>Address</strong></td>
                        <td>${family.address || 'Not set'}</td>
                    </tr>
                    <tr>
                        <td><strong>Phone</strong></td>
                        <td>${family.phone || 'Not set'}</td>
                    </tr>
                    <tr>
                        <td><strong>Email</strong></td>
                        <td>${family.email || 'Not set'}</td>
                    </tr>
                    <tr>
                        <td><strong>Created</strong></td>
                        <td>${new Date(family.createdAt).toLocaleDateString()}</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        // Update family actions
        const familyActionsDiv = document.getElementById('familyActions');
        if (familyActionsDiv && canEditData()) {
            familyActionsDiv.innerHTML = '<button class="btn" onclick="editFamily()">Edit Family</button>';
        }
    } catch (error) {
        console.error('Error displaying family info:', error);
    }
}

// Display members from MongoDB
async function displayMembersFromMongoDB() {
    try {
        const members = await api.getMembers();
        
        if (members.length === 0) {
            document.getElementById('membersList').innerHTML = '<div class="empty-state">No members found</div>';
            return;
        }
        
        const membersHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" onclick="toggleSelectAllMembers()" id="selectAllMembers"></th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Pricing Plan</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(member => `
                        <tr onclick="editMember('${member._id}')" style="cursor: pointer;">
                            <td><input type="checkbox" onclick="toggleMemberSelection('${member._id}'); event.stopPropagation();" class="member-checkbox"></td>
                            <td><strong>${member.firstName} ${member.lastName}</strong></td>
                            <td>${member.email}</td>
                            <td>${member.phone}</td>
                            <td><span class="status-badge status-active">${member.role}</span></td>
                            <td>${member.pricingPlanId ? member.pricingPlanId.title : '-'}</td>
                            <td>$${member.balance}</td>
                            <td><span class="status-badge ${member.isActive ? 'status-active' : 'status-inactive'}">${member.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <div class="table-actions">
                                    ${canEditData() ? `<button class="btn btn-warning" onclick="editMember('${member._id}'); event.stopPropagation();">Edit</button>` : ''}
                                    ${canDeleteData() ? `<button class="btn btn-danger" onclick="deleteMember('${member._id}'); event.stopPropagation();">Delete</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('membersList').innerHTML = membersHtml;
        
        // Update search stats
        const searchStats = document.getElementById('membersSearchStats');
        if (searchStats) {
            searchStats.textContent = `Showing ${members.length} members`;
        }
        
        // Update members actions
        const membersActionsDiv = document.getElementById('membersActions');
        if (membersActionsDiv && canEditData()) {
            membersActionsDiv.innerHTML = '<button class="btn" onclick="showAddMemberForm()">Add Member</button>';
        }
    } catch (error) {
        console.error('Error displaying members:', error);
    }
}

// Display subscriptions from MongoDB
async function displaySubscriptionsFromMongoDB() {
    try {
        const subscriptions = await api.getSubscriptions();
        
        if (subscriptions.length === 0) {
            document.getElementById('subscriptionsList').innerHTML = '<div class="empty-state">No subscriptions found</div>';
            return;
        }
        
        const subscriptionsHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Plan</th>
                        <th>Member</th>
                        <th>Monthly Amount</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Start Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${subscriptions.map(sub => `
                        <tr onclick="editSubscription('${sub._id}')" style="cursor: pointer;">
                            <td><strong>${sub.pricePlanTitle}</strong></td>
                            <td>${sub.memberId.firstName} ${sub.memberId.lastName}</td>
                            <td>$${sub.monthlyAmount}</td>
                            <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
                            <td>${sub.currentMonth}/${sub.totalMonths}</td>
                            <td>${new Date(sub.startDate).toLocaleDateString()}</td>
                            <td>
                                <div class="table-actions">
                                    ${canEditData() ? `<button class="btn btn-warning" onclick="editSubscription('${sub._id}'); event.stopPropagation();">Edit</button>` : ''}
                                    ${canDeleteData() ? `<button class="btn btn-danger" onclick="deleteSubscription('${sub._id}'); event.stopPropagation();">Delete</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('subscriptionsList').innerHTML = subscriptionsHtml;
        
        // Update subscriptions actions
        const subscriptionsActionsDiv = document.getElementById('subscriptionsActions');
        if (subscriptionsActionsDiv && canEditData()) {
            subscriptionsActionsDiv.innerHTML = '<button class="btn" onclick="showAddSubscriptionForm()">Add Subscription</button>';
        }
    } catch (error) {
        console.error('Error displaying subscriptions:', error);
    }
}

// Display statements from MongoDB
async function displayStatementsFromMongoDB() {
    try {
        const statements = await api.getStatements();
        
        if (statements.length === 0) {
            document.getElementById('statementsList').innerHTML = '<div class="empty-state">No statements found</div>';
            return;
        }
        
        const statementsHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Statement #</th>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Billing Date</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${statements.map(stmt => `
                        <tr onclick="editStatement('${stmt._id}')" style="cursor: pointer;">
                            <td><strong>#${stmt.statementNumber}</strong></td>
                            <td>${stmt.memberId.firstName} ${stmt.memberId.lastName}</td>
                            <td>$${stmt.amount}</td>
                            <td><span class="status-badge status-${stmt.status}">${stmt.status.toUpperCase()}</span></td>
                            <td>${new Date(stmt.billingDate).toLocaleDateString()}</td>
                            <td>${new Date(stmt.dueDate).toLocaleDateString()}</td>
                            <td>
                                <div class="table-actions">
                                    ${canEditData() ? `<button class="btn btn-warning" onclick="editStatement('${stmt._id}'); event.stopPropagation();">Edit</button>` : ''}
                                    <button class="btn btn-secondary" onclick="generateStatementPDF('${stmt._id}'); event.stopPropagation();">📄 PDF</button>
                                    <button class="btn btn-success" onclick="downloadStatement('${stmt._id}'); event.stopPropagation();">📄 Download</button>
                                    ${stmt.status === 'pending' ? `<button class="btn btn-success" onclick="payStatement('${stmt._id}'); event.stopPropagation();">Pay Now</button>` : ''}
                                    ${canDeleteData() ? `<button class="btn btn-danger" onclick="deleteStatement('${stmt._id}'); event.stopPropagation();">Delete</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('statementsList').innerHTML = statementsHtml;
        
        // Update statements actions
        const statementsActionsDiv = document.getElementById('statementsActions');
        if (statementsActionsDiv && canEditData()) {
            statementsActionsDiv.innerHTML = '<button class="btn" onclick="generateNextMonthFromMongoDB()">Generate Next Month</button>';
        }
    } catch (error) {
        console.error('Error displaying statements:', error);
    }
}

// Display pricing plans from MongoDB
async function displayPricingPlansFromMongoDB() {
    try {
        const plans = await api.getPricingPlans();
        
        if (plans.length === 0) {
            document.getElementById('pricingList').innerHTML = '<div class="empty-state">No pricing plans found</div>';
            return;
        }
        
        const pricingHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Plan Title</th>
                        <th>Description</th>
                        <th>Yearly Price</th>
                        <th>Monthly Price</th>
                        <th>Features</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${plans.map(plan => `
                        <tr onclick="editPricing('${plan._id}')" style="cursor: pointer;">
                            <td><strong>${plan.title}</strong></td>
                            <td>${plan.description}</td>
                            <td>$${plan.yearlyPrice}</td>
                            <td>$${plan.monthlyPrice}</td>
                            <td>${plan.features.join(', ')}</td>
                            <td><span class="status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}">${plan.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <div class="table-actions">
                                    ${canEditData() ? `<button class="btn btn-warning" onclick="editPricing('${plan._id}'); event.stopPropagation();">Edit</button>` : ''}
                                    ${canDeleteData() ? `<button class="btn btn-danger" onclick="deletePricing('${plan._id}'); event.stopPropagation();">Delete</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('pricingList').innerHTML = pricingHtml;
        
        // Update pricing actions
        const pricingActionsDiv = document.getElementById('pricingActions');
        if (pricingActionsDiv && canEditData()) {
            pricingActionsDiv.innerHTML = '<button class="btn" onclick="showAddPricingForm()">Add Pricing Plan</button>';
        }
    } catch (error) {
        console.error('Error displaying pricing plans:', error);
    }
}

// Display activities from MongoDB
async function displayActivitiesFromMongoDB() {
    try {
        const activities = await api.getActivities();
        
        if (activities.length === 0) {
            document.getElementById('recentActivity').innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        const activitiesHtml = activities.slice(0, 10).map(activity => `
            <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px;">
                <strong>${activity.action}</strong><br>
                <small>${activity.description}</small><br>
                <small style="color: #718096;">${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
        
        document.getElementById('recentActivity').innerHTML = activitiesHtml;
    } catch (error) {
        console.error('Error displaying activities:', error);
    }
}

// Generate next month statements from MongoDB
async function generateNextMonthFromMongoDB() {
    try {
        const result = await api.generateNextMonthStatements();
        alert(`Generated ${result.count} new statements successfully!`);
        await refreshDisplayFromMongoDB();
    } catch (error) {
        alert('Error generating statements: ' + error.message);
    }
}

// Enhanced save new member function
async function saveNewMemberToMongoDB() {
    const firstName = document.getElementById('addMemberFirstName').value.trim();
    const lastName = document.getElementById('addMemberLastName').value.trim();
    const email = document.getElementById('addMemberEmail').value.trim();
    const phone = document.getElementById('addMemberPhone').value.trim();
    const role = document.getElementById('addMemberRole').value;
    const pricingPlanId = document.getElementById('addMemberPricingPlan').value || null;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
        alert('Please fill in all required fields (First Name, Last Name, Email, Phone)');
        return;
    }
    
    try {
        const result = await api.createMember({
            firstName,
            lastName,
            email,
            phone,
            role,
            pricingPlanId
        });
        
        closeModal('addMemberModal');
        await refreshDisplayFromMongoDB();
        
        if (result.tempPassword) {
            alert(`Member created successfully!\nTemporary password: ${result.tempPassword}\nPlease share this with the new member.`);
        }
    } catch (error) {
        alert('Error creating member: ' + error.message);
    }
}

// Enhanced save new subscription function
async function saveNewSubscriptionToMongoDB() {
    const memberId = document.getElementById('addSubscriptionMember').value;
    const planId = document.getElementById('addSubscriptionPlan').value;
    const startDate = document.getElementById('addSubscriptionStartDate').value;
    
    if (!memberId || !planId || !startDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        await api.createSubscription({
            memberId,
            pricePlanId: planId,
            startDate
        });
        
        closeModal('addSubscriptionModal');
        await refreshDisplayFromMongoDB();
        alert('Subscription created successfully!');
    } catch (error) {
        alert('Error creating subscription: ' + error.message);
    }
}

// Enhanced save new pricing plan function
async function saveNewPricingToMongoDB() {
    const title = document.getElementById('addPricingTitle').value.trim();
    const description = document.getElementById('addPricingDescription').value.trim();
    const yearlyPrice = parseCurrencyValue(document.getElementById('addPricingYearlyPrice').value) || 0;
    const monthlyPrice = parseCurrencyValue(document.getElementById('addPricingMonthlyPrice').value) || 0;
    const features = document.getElementById('addPricingFeatures').value.split(',').map(f => f.trim()).filter(f => f);
    const isActive = document.getElementById('addPricingStatus').value === 'active';
    
    if (!title || !description || yearlyPrice <= 0 || monthlyPrice <= 0) {
        alert('Please fill in all required fields (Title, Description, Yearly Price, Monthly Price)');
        return;
    }
    
    try {
        await api.createPricingPlan({
            title,
            description,
            yearlyPrice,
            monthlyPrice,
            features,
            isActive
        });
        
        closeModal('addPricingModal');
        await refreshDisplayFromMongoDB();
        alert('Pricing plan created successfully!');
    } catch (error) {
        alert('Error creating pricing plan: ' + error.message);
    }
}

// Initialize MongoDB connection on page load
async function initializeMongoDB() {
    try {
        console.log('🔄 Initializing MongoDB connection...');
        
        // Test server connection first
        try {
            await api.initData();
            console.log('✅ Server connection successful');
        } catch (error) {
            console.error('❌ Server connection failed:', error.message);
            throw new Error('Server not available');
        }
        
        // Check if user is already logged in
        if (api.token && api.currentUser) {
            console.log('🔍 Checking existing login...');
            // Verify token is still valid
            try {
                await api.getFamily();
                
                // Token is valid, show main app
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'flex';
                updateUserInfo();
                await refreshDisplayFromMongoDB();
                showSection('overview');
                console.log('✅ Auto-logged in successfully');
            } catch (error) {
                console.log('⚠️ Token invalid, clearing auth');
                // Token is invalid, clear auth
                api.clearAuth();
            }
        } else {
            console.log('ℹ️ No existing login found');
        }
        
        console.log('✅ MongoDB initialization completed');
    } catch (error) {
        console.error('❌ MongoDB initialization failed:', error);
        throw error;
    }
}

// Update user info function
function updateUserInfo() {
    if (api.currentUser) {
        document.getElementById('currentUserName').textContent = `${api.currentUser.firstName} ${api.currentUser.lastName}`;
        document.getElementById('currentUserRole').textContent = api.currentUser.role.replace('_', ' ');
    }
}

// Permission functions
function canViewAllData() {
    return api.currentUser && ['super_admin', 'admin'].includes(api.currentUser.role);
}

function canEditData() {
    return api.currentUser && ['super_admin', 'admin'].includes(api.currentUser.role);
}

function canDeleteData() {
    return api.currentUser && api.currentUser.role === 'super_admin';
}

// Export functions for use in HTML
window.api = api;
window.loginWithMongoDB = loginWithMongoDB;
window.logoutFromMongoDB = logoutFromMongoDB;
window.refreshDisplayFromMongoDB = refreshDisplayFromMongoDB;
window.saveNewMemberToMongoDB = saveNewMemberToMongoDB;
window.saveNewSubscriptionToMongoDB = saveNewSubscriptionToMongoDB;
window.saveNewPricingToMongoDB = saveNewPricingToMongoDB;
window.generateNextMonthFromMongoDB = generateNextMonthFromMongoDB;
window.canViewAllData = canViewAllData;
window.canEditData = canEditData;
window.canDeleteData = canDeleteData;
window.normalizeMongoData = normalizeMongoData;
window.getItemId = getItemId;
