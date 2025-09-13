const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendorflow?retryWrites=true&w=majority&appName=Cluster0';

async function createTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db();
    
    // Check existing users
    const existingUsers = await db.collection('users').find({}).toArray();
    console.log(`Found ${existingUsers.length} existing users in Atlas`);
    
    // Clear existing test users
    await db.collection('users').deleteMany({ email: { $in: ['admin@test.com', 'vendor@test.com'] } });
    console.log('Cleared existing test users');
    
    // Generate tenant ID
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
    console.log('✅ Created test users in MongoDB Atlas:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   Vendor: vendor@test.com / vendor123');
    console.log(`   Tenant ID: ${tenantId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createTestUsers();
