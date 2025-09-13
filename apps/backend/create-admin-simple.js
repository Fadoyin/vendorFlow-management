const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin';

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing admin user
    await db.collection('users').deleteOne({ email: 'admin@demo-food.com' });
    console.log('Cleared existing admin user');
    
    // Create Admin User with correct password field
    const hashedPassword = await bcrypt.hash('adminpassword123', 10);
    const adminUser = {
      _id: '68bcfb9379d9b99cbba0f670',
      tenantId: '68bcfb937a9b99cbba0f66f0',
      email: 'admin@demo-food.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin',
      status: 'active',
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        smsNotifications: false
      },
      profile: {
        avatar: '',
        phoneNumber: '+1-555-0101',
        department: 'Administration',
        position: 'System Administrator'
      },
      security: {
        lastPasswordChange: new Date(),
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        loginAttempts: 0,
        isAccountLocked: false,
        lockedUntil: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').insertOne(adminUser);
    console.log('✅ Created admin user successfully');
    
    // Verify user was created correctly
    const createdUser = await db.collection('users').findOne({ email: 'admin@demo-food.com' });
    console.log('✅ User verification:');
    console.log('  - Email:', createdUser.email);
    console.log('  - Has password field:', !!createdUser.password);
    console.log('  - Password hash length:', createdUser.password.length);
    console.log('  - Role:', createdUser.role);
    console.log('  - isActive:', createdUser.isActive);
    console.log('  - isAccountLocked:', createdUser.security?.isAccountLocked);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser(); 