const smartDB = require('./lib/smart-db');

async function startApplication() {
    try {
        console.log('🚀 Starting AI SaaS Platform with Smart Database...');
        
        // Initialize the database
        await smartDB.initialize();
        
        // Show connection status
        const status = smartDB.getConnectionStatus();
        console.log('📊 Database Status:', status.status);
        
        // Check if we have any existing data
        const families = await smartDB.getAllFamilies();
        console.log('📊 Existing families:', families.length);
        
        if (families.length === 0) {
            console.log('📝 No families found. Creating default family...');
            
            // Create default family
            const defaultFamily = {
                id: "e40e4a183dfd346e6b4705504e36c78a",
                name: "Goldberger Family",
                address: "123 Main St",
                phone: "+1234567890",
                email: "family@example.com",
                adminEmail: "test@example.com",
                adminPassword: "admin123",
                fileName: "goldberger-family-fast.html",
                isActive: true
            };
            
            await smartDB.createFamily(defaultFamily);
            console.log('✅ Default family created');
            
            // Create default members
            const defaultMembers = [
                {
                    id: "7fdd0798f880c9c3267f7e2546273b4c",
                    familyId: "e40e4a183dfd346e6b4705504e36c78a",
                    firstName: "Test",
                    lastName: "Admin",
                    email: "test@example.com",
                    phone: "+1234567890",
                    role: "super_admin",
                    password: "admin123",
                    balance: 0,
                    isActive: true
                },
                {
                    id: "joel123",
                    familyId: "e40e4a183dfd346e6b4705504e36c78a",
                    firstName: "Joel",
                    lastName: "Goldberger",
                    email: "test@gmail.com",
                    phone: "8454679683",
                    role: "member",
                    password: "member123",
                    balance: 0,
                    isActive: true
                },
                {
                    id: "admin456",
                    familyId: "e40e4a183dfd346e6b4705504e36c78a",
                    firstName: "Family",
                    lastName: "Admin",
                    email: "admin@example.com",
                    phone: "+1987654321",
                    role: "admin",
                    password: "admin456",
                    balance: 0,
                    isActive: true
                }
            ];
            
            for (const member of defaultMembers) {
                await smartDB.createMember(member);
            }
            console.log('✅ Default members created');
            
            // Create default pricing plan
            const defaultPlan = {
                id: "plan1",
                familyId: "e40e4a183dfd346e6b4705504e36c78a",
                title: "Basic Plan",
                yearlyPrice: 1200,
                monthlyPrice: 100,
                description: "Basic family membership"
            };
            
            await smartDB.createPricePlan(defaultPlan);
            console.log('✅ Default pricing plan created');
        }
        
        console.log('\n🎉 Application ready!');
        console.log('💡 You can now:');
        console.log('   1. Use the smart database in your API routes');
        console.log('   2. Import smartDB from ./lib/smart-db');
        console.log('   3. All CRUD operations are available');
        console.log('   4. Data is stored in ./data/ directory');
        
        if (status.usingMongoDB) {
            console.log('   5. Connected to MongoDB Atlas');
        } else {
            console.log('   5. Using local storage (MongoDB connection failed)');
        }
        
        // Keep the process running
        console.log('\n⏳ Database connection active. Press Ctrl+C to exit.');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🔄 Shutting down...');
            await smartDB.close();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
startApplication();
