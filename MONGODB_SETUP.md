# Goldberger Family Dashboard - MongoDB Setup Guide

This guide will help you connect your Goldberger Family Dashboard to a local MongoDB database.

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Git** (optional, for version control)

## Installation Steps

### 1. Install MongoDB

#### Option A: Local MongoDB Installation

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a service and start automatically

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the connection string in `server.js`

### 2. Install Node.js Dependencies

Navigate to the project directory and install dependencies:

```bash
cd ai-saas-platform
npm install
```

### 3. Start the Server

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Initialize Default Data

The server will automatically initialize default data when it starts, but you can also do it manually:

```bash
# Using curl
curl -X POST http://localhost:3000/api/init-data

# Or using the npm script
npm run init-data
```

## Default Login Credentials

After initialization, you can log in with these default accounts:

### Super Admin
- **Email:** test@example.com
- **Password:** admin123
- **Permissions:** Full access to all features

### Admin
- **Email:** admin@example.com
- **Password:** admin456
- **Permissions:** Can manage members, subscriptions, and statements

### Member
- **Email:** test@gmail.com
- **Password:** member123
- **Permissions:** Can view own data only

## Database Schema

The application uses the following MongoDB collections:

### Families
- `name` - Family name
- `address` - Family address
- `phone` - Contact phone
- `email` - Contact email
- `adminEmail` - Super admin email
- `adminPassword` - Hashed admin password
- `fileName` - Associated HTML file
- `createdAt` - Creation timestamp
- `isActive` - Active status

### Members
- `familyId` - Reference to family
- `firstName` - Member first name
- `lastName` - Member last name
- `email` - Unique email address
- `phone` - Contact phone
- `role` - Role (member, admin, super_admin)
- `password` - Hashed password
- `pricingPlanId` - Reference to pricing plan
- `balance` - Account balance
- `isActive` - Active status
- `createdAt` - Creation timestamp

### Pricing Plans
- `familyId` - Reference to family
- `title` - Plan title
- `description` - Plan description
- `yearlyPrice` - Annual price
- `monthlyPrice` - Monthly price
- `features` - Array of features
- `isActive` - Active status
- `createdAt` - Creation timestamp

### Subscriptions
- `familyId` - Reference to family
- `memberId` - Reference to member
- `pricePlanId` - Reference to pricing plan
- `pricePlanTitle` - Plan title (denormalized)
- `yearlyPrice` - Annual price
- `monthlyAmount` - Monthly amount
- `startDate` - Subscription start date
- `endDate` - Subscription end date
- `status` - Status (active, inactive, paused)
- `currentMonth` - Current month number
- `totalMonths` - Total months in subscription
- `createdAt` - Creation timestamp

### Statements
- `familyId` - Reference to family
- `memberId` - Reference to member
- `subscriptionId` - Reference to subscription
- `statementNumber` - Unique statement number
- `amount` - Statement amount
- `status` - Status (pending, paid, overdue)
- `billingDate` - Billing date
- `dueDate` - Due date
- `paidDate` - Payment date
- `createdAt` - Creation timestamp

### Activities
- `familyId` - Reference to family
- `userId` - Reference to user who performed action
- `action` - Action type
- `description` - Action description
- `timestamp` - Action timestamp

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Family Management
- `GET /api/family` - Get family information
- `PUT /api/family` - Update family information

### Member Management
- `GET /api/members` - Get members (filtered by role)
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Pricing Plans
- `GET /api/pricing-plans` - Get pricing plans
- `POST /api/pricing-plans` - Create pricing plan
- `PUT /api/pricing-plans/:id` - Update pricing plan
- `DELETE /api/pricing-plans/:id` - Delete pricing plan

### Subscriptions
- `GET /api/subscriptions` - Get subscriptions (filtered by role)
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Statements
- `GET /api/statements` - Get statements (filtered by role)
- `POST /api/statements/generate-next-month` - Generate next month statements
- `PUT /api/statements/:id` - Update statement
- `DELETE /api/statements/:id` - Delete statement

### Activities
- `GET /api/activities` - Get recent activities

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Data Initialization
- `POST /api/init-data` - Initialize default data

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Password Hashing** - All passwords are hashed using bcrypt
3. **Role-Based Access Control** - Different permissions for different roles
4. **Input Validation** - Server-side validation for all inputs
5. **CORS Protection** - Cross-origin request protection

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/goldberger_family
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   # Windows
   # Check Event Viewer for MongoDB logs
   
   # macOS/Linux
   tail -f /var/log/mongodb/mongod.log
   ```

3. **Test MongoDB connection:**
   ```bash
   mongo
   # or
   mongosh
   ```

### Server Issues

1. **Check if port 3000 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # macOS/Linux
   lsof -i :3000
   ```

2. **Check server logs:**
   ```bash
   npm start
   # Look for error messages in the console
   ```

### Database Issues

1. **Reset database:**
   ```bash
   # Connect to MongoDB
   mongo
   
   # Switch to database
   use goldberger_family
   
   # Drop all collections
   db.dropDatabase()
   
   # Reinitialize data
   curl -X POST http://localhost:3000/api/init-data
   ```

## Production Deployment

For production deployment, consider:

1. **Use MongoDB Atlas** for cloud database
2. **Set up environment variables** for sensitive data
3. **Use HTTPS** for secure communication
4. **Set up proper logging** and monitoring
5. **Configure backup strategies**
6. **Set up rate limiting** and security headers
7. **Use PM2** or similar for process management

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify MongoDB is running and accessible
3. Ensure all dependencies are installed
4. Check network connectivity and firewall settings
5. Review the troubleshooting section above

## License

This project is licensed under the MIT License.
