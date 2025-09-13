const { MongoClient } = require('mongodb');

async function investigateUsers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('vendor_management');
    
    console.log('📋 All users in database:');
    const users = await db.collection('users').find({}).toArray();
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('  Email:', user.email);
      console.log('  Company:', user.companyName || 'N/A');
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
      console.log('  Has password:', !!user.password);
      console.log('  Password length:', user.password ? user.password.length : 0);
      console.log('  TenantId:', user.tenantId);
      console.log('  IsActive:', user.isActive);
    });
    
    console.log(`\n📊 Total users: ${users.length}`);
    
    // Check inventory items per tenant
    console.log('\n📦 Inventory items per tenant:');
    const items = await db.collection('items').aggregate([
      {
        $group: {
          _id: '$tenantId',
          count: { $sum: 1 },
          items: { $push: { name: '$name', sku: '$sku' } }
        }
      }
    ]).toArray();
    
    items.forEach(group => {
      console.log(`\nTenant ${group._id}:`);
      console.log(`  Items: ${group.count}`);
      group.items.forEach(item => {
        console.log(`    - ${item.name} (${item.sku})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

investigateUsers(); 