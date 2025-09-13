const { MongoClient } = require('mongodb');

async function fixAdminPassword() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('vendor_management');
    
    // Get the working password hash from letipop963@fanwn.com
    const workingUser = await db.collection('users').findOne(
      { email: 'letipop963@fanwn.com' },
      { projection: { password: 1 } }
    );
    
    console.log('✅ Working user password hash found:', !!workingUser?.password);
    
    if (workingUser?.password) {
      // Copy the working password hash to the new user
      const result = await db.collection('users').updateOne(
        { email: 'jovidir840@obirah.com' },
        { $set: { password: workingUser.password, updatedAt: new Date() } }
      );
      
      console.log('✅ Password copy result:', result.modifiedCount > 0 ? 'Success' : 'Failed');
      
      // Verify the new user
      const newUser = await db.collection('users').findOne(
        { email: 'jovidir840@obirah.com' },
        { projection: { email: 1, companyName: 1, tenantId: 1, role: 1 } }
      );
      
      console.log('✅ New admin user verified:');
      console.log('   Email:', newUser.email);
      console.log('   Company:', newUser.companyName);
      console.log('   Role:', newUser.role);
      console.log('   TenantId:', newUser.tenantId);
      console.log('   Password: password123 (same as letipop963@fanwn.com)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminPassword(); 