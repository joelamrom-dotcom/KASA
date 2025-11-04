# MongoDB Visual Database Tools

## Option 1: MongoDB Compass (Official GUI - Recommended)

### Download MongoDB Compass:
1. Go to: https://www.mongodb.com/try/download/compass
2. Download the free version
3. Install it on your Windows machine

### Connect to Your Local MongoDB:
1. Open MongoDB Compass
2. Use this connection string: `mongodb://localhost:27017`
3. Click "Connect"
4. You'll see your `goldberger-family-db` database
5. Click on it to explore collections

## Option 2: Studio 3T (MongoDB Compass Alternative)

### Download Studio 3T:
1. Go to: https://studio3t.com/download/
2. Download the free version
3. Install and connect using: `mongodb://localhost:27017`

## Option 3: Web-based MongoDB Admin (Quick Setup)

### Install MongoDB Express Admin:
```bash
npm install -g mongo-express
```

### Run MongoDB Express:
```bash
mongo-express --url mongodb://localhost:27017/goldberger-family-db
```

Then visit: http://localhost:8081

## Option 4: VS Code Extension

### Install MongoDB Extension:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MongoDB for VS Code"
4. Install the official MongoDB extension
5. Connect using: `mongodb://localhost:27017`

## Your Database Details:
- **Connection String**: `mongodb://localhost:27017`
- **Database Name**: `goldberger-family-db`
- **Collections**: families, members, users, activities, pricePlans, subscriptions, statements

## Quick Test Connection:
You can test the connection by running:
```bash
node -e "const { MongoClient } = require('mongodb'); MongoClient.connect('mongodb://localhost:27017/goldberger-family-db').then(client => { console.log('Connected!'); client.close(); })"
```

## Recommended: MongoDB Compass
MongoDB Compass is the official GUI and provides the best visual experience for exploring your database, viewing documents, and running queries.
