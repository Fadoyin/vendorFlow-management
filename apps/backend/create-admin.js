const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  const client = new MongoClient('mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin');
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const adminUser = {
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin@demo-food.com',
      password: hashedPassword,
      role: 'Admin',
      companyName: 'Demo Food Manufacturing Co.',
      isActive: true,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    console.log('Admin user created:', result.insertedId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();
