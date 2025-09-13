const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configuration for Docker network
const MONGODB_URI = 'mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB in Docker network...');
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    
    // Check if users already exist
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }
    
    // Create admin user
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
    
    console.log('✅ Database seeding completed!');
    console.log('🔑 Login: admin@demo-food.com / Admin123!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

seedDatabase();
