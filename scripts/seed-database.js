const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const TENANT_ID = process.env.TENANT_ID || 'demo-tenant-001';

// Sample data
const sampleTenant = {
  _id: TENANT_ID,
  name: 'Demo Food Manufacturing Co.',
  domain: 'demo-food.com',
  industry: 'Food Manufacturing',
  subscription: {
    plan: 'Professional',
    status: 'Active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
  settings: {
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Admin',
    email: 'admin@demo-food.com',
    password: 'Admin123!',
    role: 'Admin',
    phone: '+1-555-0101',
    department: 'Management',
    jobTitle: 'System Administrator',
    permissions: [
      'read:vendors', 'write:vendors',
      'read:inventory', 'write:inventory',
      'read:purchase_orders', 'write:purchase_orders', 'approve:purchase_orders',
      'read:forecasts', 'write:forecasts',
      'manage:users', 'manage:tenant'
    ],
    isActive: true,
  },
  {
    firstName: 'Sarah',
    lastName: 'Manager',
    email: 'manager@demo-food.com',
    password: 'Manager123!',
    role: 'Manager',
    phone: '+1-555-0102',
    department: 'Operations',
    jobTitle: 'Operations Manager',
    permissions: [
      'read:vendors', 'write:vendors',
      'read:inventory', 'write:inventory',
      'read:purchase_orders', 'write:purchase_orders', 'approve:purchase_orders',
      'read:forecasts', 'write:forecasts'
    ],
    isActive: true,
  },
  {
    firstName: 'Mike',
    lastName: 'Staff',
    email: 'staff@demo-food.com',
    password: 'Staff123!',
    role: 'Staff',
    phone: '+1-555-0103',
    department: 'Procurement',
    jobTitle: 'Procurement Specialist',
    permissions: [
      'read:vendors', 'write:vendors',
      'read:inventory', 'read:purchase_orders', 'write:purchase_orders',
      'read:forecasts'
    ],
    isActive: true,
  },
];

const sampleVendors = [
  {
    name: 'Fresh Ingredients Supply Co.',
    vendorCode: 'FISC001',
    email: 'orders@freshingredients.com',
    phone: '+1-555-0201',
    address: {
      street: '123 Fresh Street',
      city: 'Fresh City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
    },
    category: 'Raw Materials',
    rating: 4.5,
    paymentTerms: 'Net 30',
    taxId: '12-3456789',
    contactPerson: {
      name: 'Jane Supplier',
      email: 'jane@freshingredients.com',
      phone: '+1-555-0202',
      title: 'Sales Manager',
    },
    documents: [],
    performance: {
      onTimeDelivery: 0.95,
      qualityRating: 4.8,
      costCompetitiveness: 4.2,
      communicationRating: 4.6,
    },
    isActive: true,
  },
  {
    name: 'Packaging Solutions Inc.',
    vendorCode: 'PSI002',
    email: 'sales@packagingsolutions.com',
    phone: '+1-555-0203',
    address: {
      street: '456 Package Avenue',
      city: 'Package City',
      state: 'TX',
      zipCode: '75001',
      country: 'USA',
    },
    category: 'Packaging',
    rating: 4.2,
    paymentTerms: 'Net 45',
    taxId: '98-7654321',
    contactPerson: {
      name: 'Bob Packager',
      email: 'bob@packagingsolutions.com',
      phone: '+1-555-0204',
      title: 'Account Manager',
    },
    documents: [],
    performance: {
      onTimeDelivery: 0.88,
      qualityRating: 4.5,
      costCompetitiveness: 4.0,
      communicationRating: 4.3,
    },
    isActive: true,
  },
  {
    name: 'Equipment & Machinery Ltd.',
    vendorCode: 'EML003',
    email: 'info@equipmentmachinery.com',
    phone: '+1-555-0205',
    address: {
      street: '789 Machine Road',
      city: 'Machine City',
      state: 'IL',
      zipCode: '60001',
      country: 'USA',
    },
    category: 'Equipment',
    rating: 4.7,
    paymentTerms: 'Net 60',
    taxId: '45-6789012',
    contactPerson: {
      name: 'Alice Engineer',
      email: 'alice@equipmentmachinery.com',
      phone: '+1-555-0206',
      title: 'Technical Sales',
    },
    documents: [],
    performance: {
      onTimeDelivery: 0.92,
      qualityRating: 4.9,
      costCompetitiveness: 3.8,
      communicationRating: 4.7,
    },
    isActive: true,
  },
];

const sampleItems = [
  {
    name: 'Organic Wheat Flour',
    sku: 'WF-ORG-001',
    barcode: '1234567890123',
    description: 'High-quality organic wheat flour for bread making',
    category: 'Raw Materials',
    subcategory: 'Grains',
    unit: 'kg',
    dimensions: {
      length: 30,
      width: 20,
      height: 15,
      weight: 25,
      unit: 'cm',
    },
    pricing: {
      costPrice: 2.50,
      sellingPrice: 3.75,
      currency: 'USD',
      taxRate: 8.25,
    },
    inventory: {
      currentStock: 1000,
      minStockLevel: 200,
      maxStockLevel: 2000,
      reorderPoint: 300,
      safetyStock: 100,
    },
    supplier: {
      primaryVendorId: null, // Will be set after vendor creation
      backupVendorId: null,
      leadTime: 7,
      minimumOrderQuantity: 100,
    },
    isActive: true,
  },
  {
    name: 'Glass Jars 500ml',
    sku: 'GJ-500-001',
    barcode: '1234567890124',
    description: 'Clear glass jars for food packaging, 500ml capacity',
    category: 'Packaging',
    subcategory: 'Containers',
    unit: 'piece',
    dimensions: {
      length: 8,
      width: 8,
      height: 12,
      weight: 0.5,
      unit: 'cm',
    },
    pricing: {
      costPrice: 0.75,
      sellingPrice: 1.20,
      currency: 'USD',
      taxRate: 8.25,
    },
    inventory: {
      currentStock: 5000,
      minStockLevel: 500,
      maxStockLevel: 10000,
      reorderPoint: 800,
      safetyStock: 200,
    },
    supplier: {
      primaryVendorId: null,
      backupVendorId: null,
      leadTime: 14,
      minimumOrderQuantity: 1000,
    },
    isActive: true,
  },
  {
    name: 'Food Grade Labels',
    sku: 'LBL-FG-001',
    barcode: '1234567890125',
    description: 'Food-safe adhesive labels for product identification',
    category: 'Packaging',
    subcategory: 'Labels',
    unit: 'roll',
    dimensions: {
      length: 100,
      width: 5,
      height: 2,
      weight: 0.1,
      unit: 'cm',
    },
    pricing: {
      costPrice: 15.00,
      sellingPrice: 22.50,
      currency: 'USD',
      taxRate: 8.25,
    },
    inventory: {
      currentStock: 50,
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 15,
      safetyStock: 5,
    },
    supplier: {
      primaryVendorId: null,
      backupVendorId: null,
      leadTime: 5,
      minimumOrderQuantity: 10,
    },
    isActive: true,
  },
];

const samplePurchaseOrders = [
  {
    poNumber: 'PO-2024-0001',
    vendorId: null, // Will be set after vendor creation
    description: 'Monthly supply of organic wheat flour',
    items: [
      {
        itemId: null, // Will be set after item creation
        quantity: 500,
        unitPrice: 2.50,
        discountPercentage: 5,
        taxPercentage: 8.25,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    ],
    totalAmount: 1312.50,
    status: 'Draft',
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    paymentTerms: 'Net 30',
    notes: 'Standard monthly order',
  },
  {
    poNumber: 'PO-2024-0002',
    vendorId: null,
    description: 'Glass jars for Q2 production',
    items: [
      {
        itemId: null,
        quantity: 2000,
        unitPrice: 0.75,
        discountPercentage: 10,
        taxPercentage: 8.25,
        expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    ],
    totalAmount: 1485.00,
    status: 'Draft',
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    paymentTerms: 'Net 45',
    notes: 'Bulk order for Q2 production planning',
  },
];

const sampleForecasts = [
  {
    name: 'Q2 2024 Demand Forecast',
    description: 'Demand forecast for Q2 2024 based on historical data and market trends',
    type: 'Demand',
    model: 'Prophet',
    periods: [
      {
        period: '2024-04',
        forecastedValue: 1200,
        actualValue: null,
        confidence: 0.85,
        metrics: {
          mape: 12.5,
          rmse: 45.2,
          mae: 38.7,
        },
      },
      {
        period: '2024-05',
        forecastedValue: 1350,
        actualValue: null,
        confidence: 0.82,
        metrics: {
          mape: 11.8,
          rmse: 42.1,
          mae: 36.9,
        },
      },
      {
        period: '2024-06',
        forecastedValue: 1280,
        actualValue: null,
        confidence: 0.88,
        metrics: {
          mape: 13.2,
          rmse: 48.3,
          mae: 41.2,
        },
      },
    ],
    parameters: {
      seasonality: 'monthly',
      trend: 'linear',
      changepoints: 3,
    },
    isActive: true,
  },
];

// Database seeding function
async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('vendor-management');
    console.log('Connected to database');
    
    // Create tenant
    console.log('Creating tenant...');
    await db.collection('tenants').insertOne(sampleTenant);
    console.log('Tenant created successfully');
    
    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userDoc = {
        ...user,
        password: hashedPassword,
        tenantId: TENANT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('users').insertOne(userDoc);
      createdUsers.push({ ...userDoc, _id: result.insertedId });
    }
    console.log(`${createdUsers.length} users created successfully`);
    
    // Create vendors
    console.log('Creating vendors...');
    const createdVendors = [];
    for (const vendor of sampleVendors) {
      const vendorDoc = {
        ...vendor,
        tenantId: TENANT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('vendors').insertOne(vendorDoc);
      createdVendors.push({ ...vendorDoc, _id: result.insertedId });
    }
    console.log(`${createdVendors.length} vendors created successfully`);
    
    // Update items with vendor references
    console.log('Creating items...');
    const createdItems = [];
    for (let i = 0; i < sampleItems.length; i++) {
      const item = sampleItems[i];
      const itemDoc = {
        ...item,
        tenantId: TENANT_ID,
        supplier: {
          ...item.supplier,
          primaryVendorId: createdVendors[i % createdVendors.length]._id,
          backupVendorId: createdVendors[(i + 1) % createdVendors.length]._id,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('items').insertOne(itemDoc);
      createdItems.push({ ...itemDoc, _id: result.insertedId });
    }
    console.log(`${createdItems.length} items created successfully`);
    
    // Update purchase orders with references
    console.log('Creating purchase orders...');
    const createdPOs = [];
    for (let i = 0; i < samplePurchaseOrders.length; i++) {
      const po = samplePurchaseOrders[i];
      const poDoc = {
        ...po,
        tenantId: TENANT_ID,
        vendorId: createdVendors[i % createdVendors.length]._id,
        items: po.items.map((item, j) => ({
          ...item,
          itemId: createdItems[j % createdItems.length]._id,
        })),
        createdBy: createdUsers[0]._id, // Admin user
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('purchase_orders').insertOne(poDoc);
      createdPOs.push({ ...poDoc, _id: result.insertedId });
    }
    console.log(`${createdPOs.length} purchase orders created successfully`);
    
    // Create forecasts
    console.log('Creating forecasts...');
    const createdForecasts = [];
    for (const forecast of sampleForecasts) {
      const forecastDoc = {
        ...forecast,
        tenantId: TENANT_ID,
        createdBy: createdUsers[0]._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('forecasts').insertOne(forecastDoc);
      createdForecasts.push({ ...forecastDoc, _id: result.insertedId });
    }
    console.log(`${createdForecasts.length} forecasts created successfully`);
    
    // Create some sample inventory movements
    console.log('Creating inventory movements...');
    const movements = [];
    for (let i = 0; i < 50; i++) {
      const movement = {
        tenantId: TENANT_ID,
        itemId: createdItems[i % createdItems.length]._id,
        type: Math.random() > 0.5 ? 'Receipt' : 'Issue',
        quantity: Math.floor(Math.random() * 100) + 10,
        reference: `REF-${Date.now()}-${i}`,
        notes: `Sample movement ${i + 1}`,
        createdBy: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        updatedAt: new Date(),
      };
      movements.push(movement);
    }
    
    if (movements.length > 0) {
      await db.collection('inventory_movements').insertMany(movements);
      console.log(`${movements.length} inventory movements created successfully`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Tenant: ${sampleTenant.name}`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Vendors: ${createdVendors.length}`);
    console.log(`   • Items: ${createdItems.length}`);
    console.log(`   • Purchase Orders: ${createdPOs.length}`);
    console.log(`   • Forecasts: ${createdForecasts.length}`);
    console.log(`   • Inventory Movements: ${movements.length}`);
    
    console.log(`\n🔑 Default Login Credentials:`);
    console.log(`   • Admin: admin@demo-food.com / Admin123!`);
    console.log(`   • Manager: manager@demo-food.com / Manager123!`);
    console.log(`   • Staff: staff@demo-food.com / Staff123!`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
