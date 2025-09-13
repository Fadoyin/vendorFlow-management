const { MongoClient, ObjectId } = require('mongodb');

async function createInventoryForNewAdmin() {
  const client = new MongoClient('mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('vendor_management');
    
    // Get the new admin's tenantId
    const newAdmin = await db.collection('users').findOne(
      { email: 'jovidir840@obirah.com' },
      { projection: { tenantId: 1, companyName: 1 } }
    );
    
    if (!newAdmin) {
      console.log('❌ New admin user not found');
      return;
    }
    
    console.log(`📋 Creating inventory for: ${newAdmin.companyName} (tenant: ${newAdmin.tenantId})`);
    
    const newItems = [
      {
        _id: new ObjectId(),
        tenantId: newAdmin.tenantId,
        sku: 'FINAL001',
        name: 'FinalTest Laptop Pro',
        description: 'High-end laptop for final testing',
        category: 'electronics',
        unitOfMeasure: 'piece',
        status: 'active',
        pricing: { costPrice: 1500, sellingPrice: 2000, currency: 'USD' },
        inventory: { 
          currentStock: 20, 
          minimumStock: 5, 
          maximumStock: 100, 
          reorderPoint: 8, 
          primaryLocation: 'FinalTest Warehouse' 
        },
        suppliers: [],
        tags: ['laptop', 'testing', 'premium'],
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
        tenantId: newAdmin.tenantId,
        sku: 'FINAL002',
        name: 'FinalTest Tablet',
        description: 'Tablet for mobile testing',
        category: 'electronics',
        unitOfMeasure: 'piece',
        status: 'active',
        pricing: { costPrice: 400, sellingPrice: 600, currency: 'USD' },
        inventory: { 
          currentStock: 15, 
          minimumStock: 3, 
          maximumStock: 50, 
          reorderPoint: 5, 
          primaryLocation: 'FinalTest Warehouse' 
        },
        suppliers: [],
        tags: ['tablet', 'mobile', 'testing'],
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
    
    await db.collection('items').insertMany(newItems);
    console.log(`✅ Created ${newItems.length} inventory items for ${newAdmin.companyName}`);
    
    await client.close();
    console.log('🔌 Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createInventoryForNewAdmin(); 