const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/goldberger_family', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB successfully!');
});

// MongoDB Schemas
const familySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: String,
    phone: String,
    email: String,
    adminEmail: { type: String, required: true },
    adminPassword: { type: String, required: true },
    fileName: String,
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

const memberSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['member', 'admin', 'super_admin'], default: 'member' },
    password: { type: String, required: true },
    pricingPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingPlan' },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const pricingPlanSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    title: { type: String, required: true },
    description: String,
    yearlyPrice: { type: Number, required: true },
    monthlyPrice: { type: Number, required: true },
    features: [String],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const subscriptionSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    pricePlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingPlan', required: true },
    pricePlanTitle: String,
    yearlyPrice: Number,
    monthlyAmount: Number,
    startDate: { type: Date, required: true },
    endDate: Date,
    status: { type: String, enum: ['active', 'inactive', 'paused'], default: 'active' },
    currentMonth: { type: Number, default: 1 },
    totalMonths: { type: Number, default: 12 },
    createdAt: { type: Date, default: Date.now }
});

const statementSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    statementNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    billingDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paidDate: Date,
    createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    action: { type: String, required: true },
    description: String,
    timestamp: { type: Date, default: Date.now }
});

// Models
const Family = mongoose.model('Family', familySchema);
const Member = mongoose.model('Member', memberSchema);
const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Statement = mongoose.model('Statement', statementSchema);
const Activity = mongoose.model('Activity', activitySchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        console.log('JWT verified successfully:', {
            userId: user.userId,
            familyId: user.familyId,
            role: user.role,
            email: user.email
        });
        
        req.user = user;
        next();
    });
};

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'goldberger-family-fast.html'));
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const member = await Member.findOne({ email }).populate('familyId');
        if (!member) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, member.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (!member.isActive) {
            return res.status(401).json({ error: 'Account is inactive' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: member._id, 
                familyId: member.familyId._id, 
                role: member.role,
                email: member.email 
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // Log activity
        await Activity.create({
            familyId: member.familyId._id,
            userId: member._id,
            action: 'LOGIN',
            description: `${member.firstName} ${member.lastName} logged in`
        });

        res.json({
            token,
            user: {
                id: member._id,
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                role: member.role,
                familyId: member.familyId._id,
                familyName: member.familyId.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Family Routes
app.get('/api/family', authenticateToken, async (req, res) => {
    try {
        const family = await Family.findById(req.user.familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        res.json(family);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/family', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { name, address, phone, email } = req.body;
        const family = await Family.findByIdAndUpdate(
            req.user.familyId,
            { name, address, phone, email },
            { new: true }
        );

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'UPDATE_FAMILY',
            description: 'Family information updated'
        });

        res.json(family);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Members Routes
app.get('/api/members', authenticateToken, async (req, res) => {
    try {
        let query = { familyId: req.user.familyId };
        
        // If not admin/super_admin, only show own data
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            query._id = req.user.userId;
        }

        const members = await Member.find(query).populate('pricingPlanId');
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/members', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { firstName, lastName, email, phone, role, pricingPlanId } = req.body;
        
        // Hash password (generate a random one for new members)
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        const member = await Member.create({
            familyId: req.user.familyId,
            firstName,
            lastName,
            email,
            phone,
            role,
            pricingPlanId,
            password: hashedPassword
        });

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'CREATE_MEMBER',
            description: `Created member: ${firstName} ${lastName}`
        });

        res.json({ member, tempPassword: password });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/members/:id', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { firstName, lastName, email, phone, role, pricingPlanId } = req.body;
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, phone, role, pricingPlanId },
            { new: true }
        );

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'UPDATE_MEMBER',
            description: `Updated member: ${firstName} ${lastName}`
        });

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/members/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const member = await Member.findByIdAndDelete(req.params.id);
        
        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'DELETE_MEMBER',
            description: `Deleted member: ${member.firstName} ${member.lastName}`
        });

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Pricing Plans Routes
app.get('/api/pricing-plans', authenticateToken, async (req, res) => {
    try {
        const plans = await PricingPlan.find({ familyId: req.user.familyId });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/pricing-plans', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const plan = await PricingPlan.create({
            familyId: req.user.familyId,
            ...req.body
        });

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'CREATE_PRICING_PLAN',
            description: `Created pricing plan: ${plan.title}`
        });

        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Subscriptions Routes
app.get('/api/subscriptions', authenticateToken, async (req, res) => {
    try {
        let query = { familyId: req.user.familyId };
        
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            query.memberId = req.user.userId;
        }

        const subscriptions = await Subscription.find(query)
            .populate('memberId', 'firstName lastName')
            .populate('pricePlanId');
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/subscriptions', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Get the pricing plan to set the monthly amount
        const pricingPlan = await PricingPlan.findById(req.body.pricePlanId);
        if (!pricingPlan) {
            return res.status(400).json({ error: 'Pricing plan not found' });
        }

        const subscription = await Subscription.create({
            familyId: req.user.familyId,
            memberId: req.body.memberId,
            pricePlanId: req.body.pricePlanId,
            pricePlanTitle: pricingPlan.title,
            yearlyPrice: pricingPlan.yearlyPrice,
            monthlyAmount: pricingPlan.monthlyPrice,
            startDate: req.body.startDate,
            status: 'active',
            currentMonth: 1,
            totalMonths: 12
        });

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'CREATE_SUBSCRIPTION',
            description: `Created subscription for member`
        });

        res.json(subscription);
    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Statements Routes
app.get('/api/statements', authenticateToken, async (req, res) => {
    try {
        let query = { familyId: req.user.familyId };
        
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            query.memberId = req.user.userId;
        }

        const statements = await Statement.find(query)
            .populate('memberId', 'firstName lastName')
            .populate('subscriptionId');
        res.json(statements);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Debug endpoint to check subscription data
app.get('/api/debug/subscriptions', authenticateToken, async (req, res) => {
    try {
        console.log('Debug subscriptions request received:', {
            userId: req.user.userId,
            familyId: req.user.familyId,
            role: req.user.role
        });

        const subscriptions = await Subscription.find({ 
            familyId: req.user.familyId 
        }).populate('memberId', 'firstName lastName').populate('pricePlanId');

        console.log(`Found ${subscriptions.length} subscriptions total`);

        const subscriptionData = subscriptions.map(sub => ({
            id: sub._id,
            memberId: sub.memberId,
            memberName: sub.memberId ? `${sub.memberId.firstName} ${sub.memberId.lastName}` : 'Unknown',
            pricePlanId: sub.pricePlanId,
            pricePlanTitle: sub.pricePlanTitle,
            monthlyAmount: sub.monthlyAmount,
            status: sub.status,
            currentMonth: sub.currentMonth,
            totalMonths: sub.totalMonths,
            startDate: sub.startDate
        }));

        res.json({
            user: {
                userId: req.user.userId,
                familyId: req.user.familyId,
                role: req.user.role
            },
            subscriptions: subscriptionData,
            count: subscriptions.length
        });
    } catch (error) {
        console.error('Debug subscriptions error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.post('/api/statements/generate-next-month', authenticateToken, async (req, res) => {
    try {
        console.log('Statement generation request received:', {
            userId: req.user.userId,
            familyId: req.user.familyId,
            role: req.user.role
        });

        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!req.user.familyId) {
            console.error('No familyId found in user object');
            return res.status(400).json({ error: 'Family ID not found' });
        }

        const subscriptions = await Subscription.find({ 
            familyId: req.user.familyId, 
            status: 'active' 
        });

        console.log(`Found ${subscriptions.length} active subscriptions`);

        const newStatements = [];
        for (const subscription of subscriptions) {
            console.log('Processing subscription:', {
                id: subscription._id,
                memberId: subscription.memberId,
                currentMonth: subscription.currentMonth,
                totalMonths: subscription.totalMonths,
                monthlyAmount: subscription.monthlyAmount
            });

            const nextMonth = subscription.currentMonth + 1;
            if (nextMonth <= subscription.totalMonths) {
                // Ensure monthlyAmount exists
                const monthlyAmount = subscription.monthlyAmount || 0;
                
                const statement = await Statement.create({
                    familyId: req.user.familyId,
                    memberId: subscription.memberId,
                    subscriptionId: subscription._id,
                    statementNumber: `STMT-${Date.now()}-${subscription._id}`,
                    amount: monthlyAmount,
                    status: 'pending',
                    billingDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                });

                subscription.currentMonth = nextMonth;
                await subscription.save();
                newStatements.push(statement);
                console.log(`Created statement for subscription ${subscription._id}`);
            } else {
                console.log(`Subscription ${subscription._id} has reached maximum months`);
            }
        }

        await Activity.create({
            familyId: req.user.familyId,
            userId: req.user.userId,
            action: 'GENERATE_STATEMENTS',
            description: `Generated ${newStatements.length} new statements`
        });

        console.log(`Successfully generated ${newStatements.length} statements`);
        res.json({ statements: newStatements, count: newStatements.length });
    } catch (error) {
        console.error('Statement generation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Activities Routes
app.get('/api/activities', authenticateToken, async (req, res) => {
    try {
        const activities = await Activity.find({ familyId: req.user.familyId })
            .populate('userId', 'firstName lastName')
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        let memberQuery = { familyId: req.user.familyId };
        let subscriptionQuery = { familyId: req.user.familyId };
        let statementQuery = { familyId: req.user.familyId };

        if (!['admin', 'super_admin'].includes(req.user.role)) {
            memberQuery._id = req.user.userId;
            subscriptionQuery.memberId = req.user.userId;
            statementQuery.memberId = req.user.userId;
        }

        const [totalMembers, activeSubscriptions, totalStatements, totalRevenue] = await Promise.all([
            Member.countDocuments(memberQuery),
            Subscription.countDocuments({ ...subscriptionQuery, status: 'active' }),
            Statement.countDocuments(statementQuery),
            Statement.aggregate([
                { $match: { ...statementQuery, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        res.json({
            totalMembers,
            activeSubscriptions,
            totalStatements,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize default data
app.post('/api/init-data', async (req, res) => {
    try {
        // Check if data already exists
        const existingFamily = await Family.findOne({ name: 'Goldberger Family' });
        if (existingFamily) {
            return res.json({ message: 'Data already initialized' });
        }

        // Create default family
        const family = await Family.create({
            name: 'Goldberger Family',
            address: '123 Main St',
            phone: '+1234567890',
            email: 'family@example.com',
            adminEmail: 'test@example.com',
            adminPassword: await bcrypt.hash('admin123', 10),
            fileName: 'goldberger-family-fast.html'
        });

        // Create default pricing plans
        const basicPlan = await PricingPlan.create({
            familyId: family._id,
            title: 'Basic Family Plan',
            description: 'Monthly family subscription',
            yearlyPrice: 1200,
            monthlyPrice: 100,
            features: ['Family access', 'Monthly statements', 'Payment tracking'],
            isActive: true
        });

        const premiumPlan = await PricingPlan.create({
            familyId: family._id,
            title: 'Premium Family Plan',
            description: 'Enhanced family features',
            yearlyPrice: 2400,
            monthlyPrice: 200,
            features: ['All Basic features', 'Priority support', 'Advanced analytics'],
            isActive: true
        });

        // Create default members
        const superAdmin = await Member.create({
            familyId: family._id,
            firstName: 'Test',
            lastName: 'Admin',
            email: 'test@example.com',
            phone: '+1234567890',
            role: 'super_admin',
            password: await bcrypt.hash('admin123', 10)
        });

        const member = await Member.create({
            familyId: family._id,
            firstName: 'Joel',
            lastName: 'Goldberger',
            email: 'test@gmail.com',
            phone: '8454679683',
            role: 'member',
            password: await bcrypt.hash('member123', 10),
            pricingPlanId: basicPlan._id
        });

        const admin = await Member.create({
            familyId: family._id,
            firstName: 'Family',
            lastName: 'Admin',
            email: 'admin@example.com',
            phone: '+1987654321',
            role: 'admin',
            password: await bcrypt.hash('admin456', 10)
        });

        res.json({ 
            message: 'Default data initialized successfully',
            family: family._id,
            members: [superAdmin._id, member._id, admin._id],
            plans: [basicPlan._id, premiumPlan._id]
        });
    } catch (error) {
        console.error('Init data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB connected to mongodb://localhost:27017/goldberger_family`);
});
