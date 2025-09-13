const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin';

async function seedCompleteData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear all collections
    const collections = ['users', 'vendors', 'suppliers', 'items', 'orders', 'notifications'];
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
      console.log(`Cleared ${collection} collection`);
    }
    
    // Common IDs for demo
    const TENANT_ID = '68bcfb937a9b99cbba0f66f';
    const ADMIN_USER_ID = '68bcfb9379d9b99cbba0f670';
    
    // 1. Create Admin User with correct fields
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = {
      _id: ADMIN_USER_ID,
      tenantId: TENANT_ID,
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
    console.log('Created admin user');
    
    // 2. Create Vendors
    const vendors = [
      {
        _id: '507f1f77bcf86cd799439011',
        tenantId: TENANT_ID,
        vendorCode: 'VEND-001',
        name: 'Fresh Farms Supplier',
        category: 'agriculture',
        type: 'supplier',
        status: 'active',
        primaryContact: {
          name: 'Alice Johnson',
          email: 'alice@freshfarms.com',
          phone: '+1-555-0201',
          position: 'Sales Manager'
        },
        address: {
          street: '123 Farm Road',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA'
        },
        businessInfo: {
          registrationNumber: 'REG-FF-2023',
          taxId: 'TAX-123456789',
          businessType: 'LLC',
          yearEstablished: 2018,
          website: 'https://freshfarms.com',
          description: 'Premium organic produce supplier specializing in fresh vegetables and fruits.'
        },
        performance: {
          overallScore: 4.5,
          qualityScore: 4.7,
          deliveryScore: 4.3,
          serviceScore: 4.5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '507f1f77bcf86cd799439012',
        tenantId: TENANT_ID,
        vendorCode: 'VEND-002',
        name: 'Global Electronics Inc',
        category: 'technology',
        type: 'supplier',
        status: 'active',
        primaryContact: {
          name: 'Bob Wilson',
          email: 'bob@globalelectronics.com',
          phone: '+1-555-0202',
          position: 'Account Executive'
        },
        address: {
          street: '456 Tech Avenue',
          city: 'Austin',
          state: 'TX',
          zipCode: '73301',
          country: 'USA'
        },
        businessInfo: {
          registrationNumber: 'REG-GE-2020',
          taxId: 'TAX-987654321',
          businessType: 'Corporation',
          yearEstablished: 2015,
          website: 'https://globalelectronics.com',
          description: 'Leading supplier of electronic components and devices.'
        },
        performance: {
          overallScore: 4.2,
          qualityScore: 4.4,
          deliveryScore: 4.0,
          serviceScore: 4.2
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '507f1f77bcf86cd799439013',
        tenantId: TENANT_ID,
        vendorCode: 'VEND-003',
        name: 'Industrial Materials Corp',
        category: 'manufacturing',
        type: 'supplier',
        status: 'active',
        primaryContact: {
          name: 'Carol Davis',
          email: 'carol@industrialmaterials.com',
          phone: '+1-555-0203',
          position: 'Business Development'
        },
        address: {
          street: '789 Industrial Blvd',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201',
          country: 'USA'
        },
        businessInfo: {
          registrationNumber: 'REG-IM-2019',
          taxId: 'TAX-456789123',
          businessType: 'Corporation',
          yearEstablished: 2012,
          website: 'https://industrialmaterials.com',
          description: 'Comprehensive supplier of raw materials and manufacturing components.'
        },
        performance: {
          overallScore: 4.0,
          qualityScore: 4.1,
          deliveryScore: 3.9,
          serviceScore: 4.0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('vendors').insertMany(vendors);
    console.log('Created vendors');
    
    // 3. Create Suppliers (copy of vendors)
    const suppliers = vendors.map(vendor => ({
      ...vendor,
      _id: vendor._id.replace('11', '21').replace('12', '22').replace('13', '23'),
      supplierCode: vendor.vendorCode.replace('VEND', 'SUPP')
    }));
    
    await db.collection('suppliers').insertMany(suppliers);
    console.log('Created suppliers');
    
    // 4. Create Inventory Items
    const items = [
      {
        _id: '507f1f77bcf86cd799439031',
        tenantId: TENANT_ID,
        name: 'Organic Tomatoes',
        sku: 'FOOD-TOM-001',
        category: 'produce',
        description: 'Fresh organic tomatoes, premium quality',
        tags: ['organic', 'fresh', 'produce', 'vegetables'],
        inventory: {
          currentStock: 150,
          availableStock: 145,
          reservedStock: 5,
          reorderPoint: 30,
          maxStock: 500,
          unit: 'lbs'
        },
        pricing: {
          unitCost: 3.50,
          sellingPrice: 5.25,
          currency: 'USD',
          lastUpdated: new Date()
        },
        vendor: {
          vendorId: '507f1f77bcf86cd799439011',
          vendorName: 'Fresh Farms Supplier',
          leadTime: 2
        },
        specifications: {
          weight: '1 lb',
          dimensions: '4x4x3 inches',
          shelfLife: '7 days',
          storageConditions: 'Cool, dry place'
        },
        compliance: {
          certifications: ['USDA Organic', 'Non-GMO'],
          regulatoryStatus: 'approved'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '507f1f77bcf86cd799439032',
        tenantId: TENANT_ID,
        name: 'Wireless Bluetooth Headphones',
        sku: 'ELEC-HEAD-001',
        category: 'electronics',
        description: 'High-quality wireless Bluetooth headphones with noise cancellation',
        tags: ['electronics', 'audio', 'wireless', 'bluetooth'],
        inventory: {
          currentStock: 75,
          availableStock: 70,
          reservedStock: 5,
          reorderPoint: 20,
          maxStock: 200,
          unit: 'pieces'
        },
        pricing: {
          unitCost: 45.00,
          sellingPrice: 89.99,
          currency: 'USD',
          lastUpdated: new Date()
        },
        vendor: {
          vendorId: '507f1f77bcf86cd799439012',
          vendorName: 'Global Electronics Inc',
          leadTime: 5
        },
        specifications: {
          weight: '0.5 lbs',
          dimensions: '7x6x3 inches',
          batteryLife: '30 hours',
          connectivity: 'Bluetooth 5.0'
        },
        compliance: {
          certifications: ['FCC', 'CE', 'RoHS'],
          regulatoryStatus: 'approved'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '507f1f77bcf86cd799439033',
        tenantId: TENANT_ID,
        name: 'Stainless Steel Bolts',
        sku: 'MFG-BOLT-001',
        category: 'hardware',
        description: 'High-grade stainless steel bolts, M8 x 20mm',
        tags: ['hardware', 'bolts', 'stainless steel', 'manufacturing'],
        inventory: {
          currentStock: 2500,
          availableStock: 2450,
          reservedStock: 50,
          reorderPoint: 500,
          maxStock: 5000,
          unit: 'pieces'
        },
        pricing: {
          unitCost: 0.25,
          sellingPrice: 0.50,
          currency: 'USD',
          lastUpdated: new Date()
        },
        vendor: {
          vendorId: '507f1f77bcf86cd799439013',
          vendorName: 'Industrial Materials Corp',
          leadTime: 7
        },
        specifications: {
          material: 'Stainless Steel 316',
          size: 'M8 x 20mm',
          threadType: 'Metric',
          strength: 'Grade 8.8'
        },
        compliance: {
          certifications: ['ISO 9001', 'ASTM'],
          regulatoryStatus: 'approved'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('items').insertMany(items);
    console.log('Created inventory items');
    
    // 5. Create Sample Orders
    const orders = [
      {
        _id: '507f1f77bcf86cd799439041',
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-001',
        vendorId: '507f1f77bcf86cd799439011',
        supplierId: '507f1f77bcf86cd799439021',
        status: 'delivered',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expectedArrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualArrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: '507f1f77bcf86cd799439031',
            stockName: 'Organic Tomatoes',
            sku: 'FOOD-TOM-001',
            quantity: 50,
            unitPrice: 3.50,
            totalPrice: 175.00,
            notes: 'Premium quality required'
          }
        ],
        subtotal: 175.00,
        tax: 14.00,
        shipping: 15.00,
        discount: 0,
        totalAmount: 204.00,
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB Destination',
        notes: 'Regular weekly produce order',
        createdBy: ADMIN_USER_ID,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        _id: '507f1f77bcf86cd799439042',
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-002',
        vendorId: '507f1f77bcf86cd799439012',
        supplierId: '507f1f77bcf86cd799439022',
        status: 'shipped',
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedArrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: '507f1f77bcf86cd799439032',
            stockName: 'Wireless Bluetooth Headphones',
            sku: 'ELEC-HEAD-001',
            quantity: 10,
            unitPrice: 45.00,
            totalPrice: 450.00,
            notes: 'Black color preferred'
          }
        ],
        subtotal: 450.00,
        tax: 36.00,
        shipping: 25.00,
        discount: 22.50,
        totalAmount: 488.50,
        paymentTerms: 'Net 15',
        deliveryTerms: 'FOB Origin',
        notes: 'Bulk electronics order for Q1',
        createdBy: ADMIN_USER_ID,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        _id: '507f1f77bcf86cd799439043',
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-003',
        vendorId: '507f1f77bcf86cd799439013',
        supplierId: '507f1f77bcf86cd799439023',
        status: 'placed',
        orderDate: new Date(),
        expectedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: '507f1f77bcf86cd799439033',
            stockName: 'Stainless Steel Bolts',
            sku: 'MFG-BOLT-001',
            quantity: 1000,
            unitPrice: 0.25,
            totalPrice: 250.00,
            notes: 'M8 x 20mm specification required'
          }
        ],
        subtotal: 250.00,
        tax: 20.00,
        shipping: 35.00,
        discount: 0,
        totalAmount: 305.00,
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB Destination',
        notes: 'Manufacturing supplies restock',
        createdBy: ADMIN_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('orders').insertMany(orders);
    console.log('Created sample orders');
    
    console.log('\n✅ Complete database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- 1 Admin User (admin@demo-food.com / Admin123!) - ACTIVE`);
    console.log(`- 3 Vendors (Fresh Farms, Global Electronics, Industrial Materials)`);
    console.log(`- 3 Suppliers (Same as vendors for demo)`);
    console.log(`- 3 Inventory Items (Tomatoes, Headphones, Bolts)`);
    console.log(`- 3 Orders (1 Delivered, 1 Shipped, 1 Placed)`);
    console.log('\n🌐 Ready for login and testing!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedCompleteData(); 