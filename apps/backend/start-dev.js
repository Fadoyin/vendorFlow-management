const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management';
  try {
    const client = new MongoClient(uri, { 
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000 
    });
    await client.connect();
    await client.close();
    console.log('✅ MongoDB is available');
    return true;
  } catch (error) {
    console.log('⚠️  MongoDB is not available. Running with mock database.');
    console.log('   To use MongoDB, install it locally or use MongoDB Atlas.');
    return false;
  }
}

async function startApp() {
  // Check MongoDB availability
  const mongoAvailable = await checkMongoDB();
  
  // Set environment variable for the app
  process.env.USE_MOCK_DB = mongoAvailable ? 'false' : 'true';
  
  // Start the NestJS application
  console.log('🚀 Starting backend server...\n');
  
  const nest = spawn('npm', ['run', 'start:dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  nest.on('error', (error) => {
    console.error('Failed to start the application:', error);
  });

  nest.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Application exited with code ${code}`);
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

startApp().catch(console.error);
