const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

const sampleSuppliers = [
  {
    _id: new ObjectId(),
    tenantId: new ObjectId('507f1f77bcf86cd799439011'), // This should match the tenant from seed
    supplierName: 'SupplyCorp Solutions',
    supplierCode: 'SCS001',
    category: 'food_supplies',
    status: 'active',
    description: 'Premium food supply company specializing in organic ingredients',
    website: 'https://supplycorp.com',
    phone: '+1-555-0123',
    email: 'orders@supplycorp.com',
    address: '123 Supply Street',
    city: 'Supply City',
    state: 'California',
    zipCode: '90210',
    country: 'United States',
    contactPerson: 'John Supply',
    contactPhone: '+1-555-0124',
    contactEmail: 'john@supplycorp.com',
    taxId: 'TAX123456789',
    paymentTerms: 'net_30',
    creditLimit: 50000,
    rating: 4.8,
    totalOrders: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    tenantId: new ObjectId('507f1f77bcf86cd799439011'),
    supplierName: 'Fresh Foods Co',
    supplierCode: 'FFC002',
    category: 'produce',
    status: 'active',
    description: 'Fresh produce supplier with farm-to-table approach',
    website: 'https://freshfoods.com',
    phone: '+1-555-0200',
    email: 'orders@freshfoods.com',
    address: '456 Fresh Lane',
    city: 'Garden Valley',
    state: 'California',
    zipCode: '90211',
    country: 'United States',
    contactPerson: 'Sarah Fresh',
    contactPhone: '+1-555-0201',
    contactEmail: 'sarah@freshfoods.com',
    taxId: 'TAX987654321',
    paymentTerms: 'net_15',
    creditLimit: 30000,
    rating: 4.5,
    totalOrders: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    tenantId: new ObjectId('507f1f77bcf86cd799439011'),
    supplierName: 'Premium Packaging Ltd',
    supplierCode: 'PPL003',
    category: 'packaging',
    status: 'active',
    description: 'Eco-friendly packaging solutions for food industry',
    website: 'https://premiumpackaging.com',
    phone: '+1-555-0300',
    email: 'sales@premiumpackaging.com',
    address: '789 Package Ave',
    city: 'Box City',
    state: 'Texas',
    zipCode: '75001',
    country: 'United States',
    contactPerson: 'Mike Package',
    contactPhone: '+1-555-0301',
    contactEmail: 'mike@premiumpackaging.com',
    taxId: 'TAX456789123',
    paymentTerms: 'net_45',
    creditLimit: 75000,
    rating: 4.7,
    totalOrders: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createSuppliers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('vendor_management');
    console.log('Connected to database');
    
    // Check if suppliers already exist
    const existingSuppliers = await db.collection('suppliers').find({}).toArray();
    console.log(`Found ${existingSuppliers.length} existing suppliers`);
    
    if (existingSuppliers.length === 0) {
      console.log('Creating suppliers...');
      await db.collection('suppliers').insertMany(sampleSuppliers);
      console.log(`${sampleSuppliers.length} suppliers created successfully`);
    } else {
      console.log('Suppliers already exist, skipping creation');
    }
    
    // List all suppliers
    const allSuppliers = await db.collection('suppliers').find({}).toArray();
    console.log('\n📋 Available Suppliers:');
    allSuppliers.forEach(supplier => {
      console.log(`   • ${supplier.supplierName} (${supplier.supplierCode}) - ${supplier.status}`);
    });
    
    console.log('\n✅ Suppliers setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating suppliers:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

createSuppliers(); 