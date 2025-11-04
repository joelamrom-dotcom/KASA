import { NextResponse } from 'next/server';
import db from '../../../../lib/database-adapter';

export async function GET() {
    try {
        // Initialize database
        await db.initialize();
        
        // Get database status from database adapter
        const dbStatus = db.getDatabaseStatus ? db.getDatabaseStatus() : {
            usingMongoDB: false,
            connected: true,
            type: 'JSON File Storage'
        };
        
        // Get some sample data
        const users = await db.getAllUsers();
        const families = await db.getAllFamilies();
        const activities = await db.getActivities(1, 1000);
        
        return NextResponse.json({
            success: true,
            database: dbStatus,
            stats: {
                users: Array.isArray(users) ? users.length : 0,
                families: Array.isArray(families) ? families.length : 0,
                activities: Array.isArray(activities) ? activities.length : (activities?.activities?.length || 0)
            },
            message: dbStatus.usingMongoDB 
                ? 'Connected to MongoDB Atlas successfully!' 
                : 'Using JSON file storage (MongoDB connection failed)'
        });
        
    } catch (error: any) {
        console.error('Database status error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

