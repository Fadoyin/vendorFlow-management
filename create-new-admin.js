const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createNewAdminUser() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('vendor_management');
    
    // Create new tenantId for the new company
    const newTenantId = new ObjectId();
    console.log(`🏢 New tenant ID: ${newTenantId}`);
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create new admin user with different company
    const newUser = {
      _id: new ObjectId(),
      tenantId: newTenantId,
      email: 'jovidir840@obirah.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin',
      status: 'active',
      companyName: 'NewTech Solutions', // Different company
      phone: '+1-555-0199',
      department: 'Administration',
      jobTitle: 'System Administrator',
      businessType: 'Technology',
      emailVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: newUser.email });
    if (existingUser) {
      console.log('⚠️  User already exists, updating...');
      await db.collection('users').updateOne(
        { email: newUser.email },
        { 
          $set: { 
            ...newUser,
            _id: existingUser._id,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      console.log('👤 Creating new admin user...');
      await db.collection('users').insertOne(newUser);
    }
    
    console.log('✅ Created admin user:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Company: ${newUser.companyName}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   TenantId: ${newUser.tenantId}`);
    console.log(`   Password: password123`);
    
    // Create some sample inventory items for the new tenant
    console.log('\n📦 Creating sample inventory for new tenant...');
    
    const sampleItems = [
      {
        _id: new ObjectId(),
        tenantId: newTenantId,
        sku: 'NEW001',
        name: 'NewTech Laptop',
        description: 'High-performance laptop for business use',
        category: 'electronics',
        unitOfMeasure: 'piece',
        status: 'active',
        pricing: {
          costPrice: 1200,
          sellingPrice: 1500,
          currency: 'USD'
        },
        inventory: {
          currentStock: 25,
          minimumStock: 5,
          maximumStock: 100,
          reorderPoint: 10,
          location: 'NewTech Warehouse'
        },
        suppliers: [],
        tags: ['laptop', 'business', 'electronics'],
        images: [],
        forecasts: [],
        purchaseOrders: [],
        isDeleted: false,
        isSerialized: false,
        isLotTracked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        tenantId: newTenantId,
        sku: 'NEW002',
        name: 'NewTech Monitor',
        description: '27-inch 4K monitor',
        category: 'electronics',
        unitOfMeasure: 'piece',
        status: 'active',
        pricing: {
          costPrice: 300,
          sellingPrice: 400,
          currency: 'USD'
        },
        inventory: {
          currentStock: 15,
          minimumStock: 3,
          maximumStock: 50,
          reorderPoint: 5,
          location: 'NewTech Warehouse'
        },
        suppliers: [],
        tags: ['monitor', 'display', 'electronics'],
        images: [],
        forecasts: [],
        purchaseOrders: [],
        isDeleted: false,
        isSerialized: false,
        isLotTracked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    // Insert sample inventory items
    await db.collection('items').insertMany(sampleItems);
    console.log(`✅ Created ${sampleItems.length} sample inventory items for NewTech Solutions`);
    
    // Verify the setup
    console.log('\n🔍 Verification:');
    const userCount = await db.collection('users').countDocuments({ tenantId: newTenantId });
    const itemCount = await db.collection('items').countDocuments({ tenantId: newTenantId });
    
    console.log(`   Users for new tenant: ${userCount}`);
    console.log(`   Inventory items for new tenant: ${itemCount}`);
    
    console.log('\n🎯 TESTING INSTRUCTIONS:');
    console.log('1. Login with jovidir840@obirah.com / password123');
    console.log('2. Should see ONLY NewTech Solutions inventory (2 items)');
    console.log('3. Should NOT see letipop963@fanwn.com inventory');
    console.log('4. This confirms proper tenant isolation!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createNewAdminUser(); 