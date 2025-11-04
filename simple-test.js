const fs = require('fs').promises;
const path = require('path');

async function simpleTest() {
  try {
    console.log('Testing basic file operations...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const dbFile = path.join(dataDir, 'database.json');
    
    console.log('1. Checking data directory...');
    console.log('Data dir:', dataDir);
    console.log('DB file:', dbFile);
    
    // Check if directory exists
    try {
      await fs.access(dataDir);
      console.log('✅ Data directory exists');
    } catch {
      console.log('❌ Data directory does not exist');
      await fs.mkdir(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }
    
    // Check if file exists
    try {
      await fs.access(dbFile);
      console.log('✅ Database file exists');
    } catch {
      console.log('❌ Database file does not exist');
    }
    
    // Try to read the file
    console.log('2. Trying to read database file...');
    try {
      const data = await fs.readFile(dbFile, 'utf8');
      console.log('✅ File read successfully');
      console.log('File content length:', data.length);
      console.log('First 100 chars:', data.substring(0, 100));
    } catch (error) {
      console.log('❌ Failed to read file:', error.message);
    }
    
    console.log('🎉 Simple test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

simpleTest();
