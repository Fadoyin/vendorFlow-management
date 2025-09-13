const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/vendorflow-test';

async function createTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing users
    await db.collection('users').deleteMany({});
    console.log('Cleared existing users');
    
    // Generate tenant ID (same for both users for simplicity)
    const tenantId = new ObjectId();
    
    // Create Admin User
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      tenantId: tenantId,
      email: 'admin@test.com',
      password: adminHashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      isActive: true,
      emailVerified: true,
      loginCount: 0,
      refreshTokenFamilies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create Vendor User
    const vendorHashedPassword = await bcrypt.hash('vendor123', 10);
    const vendorUser = {
      tenantId: tenantId,
      email: 'vendor@test.com',
      password: vendorHashedPassword,
      firstName: 'Vendor',
      lastName: 'User',
      role: 'vendor',
      status: 'active',
      isActive: true,
      emailVerified: true,
      loginCount: 0,
      refreshTokenFamilies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').insertMany([adminUser, vendorUser]);
    console.log('✅ Created test users:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   Vendor: vendor@test.com / vendor123');
    console.log(`   Tenant ID: ${tenantId}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestUsers();
