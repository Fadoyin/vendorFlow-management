const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  const client = new MongoClient('mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin');
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    // Create a tenant ID
    const tenantId = new ObjectId();
    
    const adminUser = {
      tenantId: tenantId,
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin@demo-food.com',
      password: hashedPassword,
      role: 'admin',
      companyName: 'Demo Food Manufacturing Co.',
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // First, try to delete any existing admin user
    await db.collection('users').deleteOne({ email: 'admin@demo-food.com' });
    
    const result = await db.collection('users').insertOne(adminUser);
    console.log('Admin user created:', result.insertedId);
    console.log('Email: admin@demo-food.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();
