// Script to clear test users from the database
// Run with: node scripts/clear-test-users.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:password123@localhost:27019/vendor_management?authSource=admin';

async function clearTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('vendor_management');
    const users = db.collection('users');
    
    // List current users
    console.log('\nCurrent users in database:');
    const currentUsers = await users.find({}, { email: 1, firstName: 1, lastName: 1 }).toArray();
    currentUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    // Delete test users (keep only real users if any)
    const testEmails = [
      'testuser@example.com',
      'testsupplier@test.com',
      'admin@demo-food.com',
      'test@test.com',
      'demo@demo.com'
    ];
    
    console.log('\nDeleting test users...');
    const deleteResult = await users.deleteMany({
      email: { $in: testEmails }
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} test users`);
    
    // Show remaining users
    console.log('\nRemaining users:');
    const remainingUsers = await users.find({}, { email: 1, firstName: 1, lastName: 1 }).toArray();
    if (remainingUsers.length === 0) {
      console.log('No users remaining - database is clean for testing');
    } else {
      remainingUsers.forEach(user => {
        console.log(`- ${user.email} (${user.firstName} ${user.lastName})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

clearTestUsers(); 