import fetch from 'node-fetch';

async function testWebConnection() {
    console.log('🌐 Testing Web Server Connection...');
    
    try {
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test the database status API
        const response = await fetch('http://localhost:3000/api/database/status');
        const data = await response.json();
        
        console.log('✅ Web server is running!');
        console.log('📊 Database Status:', data.database);
        console.log('📈 Statistics:', data.stats);
        console.log('💬 Message:', data.message);
        
        console.log('\n🎉 All systems are working!');
        console.log('🌐 Visit: http://localhost:3000/test-db');
        console.log('🔗 API: http://localhost:3000/api/database/status');
        
    } catch (error) {
        console.error('❌ Web server test failed:', error.message);
        console.log('💡 Make sure to run: npm run dev');
    }
}

testWebConnection();
