const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/goldberger_family', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Test MongoDB connection successful!');
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'MongoDB test server is running!',
        timestamp: new Date().toISOString(),
        status: 'connected'
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        const admin = db.db.admin();
        const result = await admin.ping();
        
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            ping: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.listen(PORT, () => {
    console.log(`🧪 MongoDB Test Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Test endpoint: http://localhost:${PORT}/test`);
});
