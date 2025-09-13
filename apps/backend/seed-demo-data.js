const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing collections for clean demo
    const collections = ['users', 'vendors', 'suppliers', 'items', 'orders', 'notifications'];
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
      console.log(`Cleared ${collection} collection`);
    }
    
    // Common tenant ID for demo
    const TENANT_ID = '68bcfb937a9b99cbba0f66f';
    const ADMIN_USER_ID = '68bcfb9379d9b99cbba0f670';
    
    // 1. Create Admin User
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = {
      _id: ADMIN_USER_ID,
      tenantId: TENANT_ID,
      email: 'admin@demo-food.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin',
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
    
    // 3. Create Suppliers (same as vendors for this demo)
    const suppliers = vendors.map(vendor => ({
      ...vendor,
      _id: vendor._id.replace('439011', '439021'), // Different IDs for suppliers
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
      },
      {
        _id: '507f1f77bcf86cd799439034',
        tenantId: TENANT_ID,
        name: 'Organic Carrots',
        sku: 'FOOD-CAR-001',
        category: 'produce',
        description: 'Fresh organic carrots, baby variety',
        tags: ['organic', 'fresh', 'produce', 'vegetables'],
        inventory: {
          currentStock: 85,
          availableStock: 80,
          reservedStock: 5,
          reorderPoint: 25,
          maxStock: 300,
          unit: 'lbs'
        },
        pricing: {
          unitCost: 2.75,
          sellingPrice: 4.50,
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
          variety: 'Baby carrots',
          shelfLife: '14 days',
          storageConditions: 'Refrigerated'
        },
        compliance: {
          certifications: ['USDA Organic'],
          regulatoryStatus: 'approved'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '507f1f77bcf86cd799439035',
        tenantId: TENANT_ID,
        name: 'USB-C Charging Cable',
        sku: 'ELEC-CABLE-001',
        category: 'electronics',
        description: '3-foot USB-C to USB-A charging cable',
        tags: ['electronics', 'cable', 'usb-c', 'charging'],
        inventory: {
          currentStock: 120,
          availableStock: 115,
          reservedStock: 5,
          reorderPoint: 30,
          maxStock: 500,
          unit: 'pieces'
        },
        pricing: {
          unitCost: 8.50,
          sellingPrice: 15.99,
          currency: 'USD',
          lastUpdated: new Date()
        },
        vendor: {
          vendorId: '507f1f77bcf86cd799439012',
          vendorName: 'Global Electronics Inc',
          leadTime: 3
        },
        specifications: {
          length: '3 feet',
          connector1: 'USB-C',
          connector2: 'USB-A',
          dataTransfer: 'Yes'
        },
        compliance: {
          certifications: ['USB-IF', 'UL'],
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
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
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
          },
          {
            inventoryId: '507f1f77bcf86cd799439034',
            stockName: 'Organic Carrots',
            sku: 'FOOD-CAR-001',
            quantity: 30,
            unitPrice: 2.75,
            totalPrice: 82.50,
            notes: 'Baby variety preferred'
          }
        ],
        subtotal: 257.50,
        tax: 20.60,
        shipping: 15.00,
        discount: 0,
        totalAmount: 293.10,
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
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
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
          },
          {
            inventoryId: '507f1f77bcf86cd799439035',
            stockName: 'USB-C Charging Cable',
            sku: 'ELEC-CABLE-001',
            quantity: 25,
            unitPrice: 8.50,
            totalPrice: 212.50,
            notes: 'Include warranty cards'
          }
        ],
        subtotal: 662.50,
        tax: 53.00,
        shipping: 25.00,
        discount: 33.13, // 5% bulk discount
        totalAmount: 707.37,
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
        orderDate: new Date(), // Today
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
    
    // 6. Create Sample Notifications
    const notifications = [
      {
        _id: '507f1f77bcf86cd799439051',
        tenantId: TENANT_ID,
        userId: ADMIN_USER_ID,
        type: 'inventory_low_stock',
        title: 'Low Stock Alert',
        message: 'Organic Carrots stock is running low (85 units remaining)',
        priority: 'medium',
        isRead: false,
        metadata: {
          itemId: '507f1f77bcf86cd799439034',
          itemName: 'Organic Carrots',
          currentStock: 85,
          reorderPoint: 25
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        _id: '507f1f77bcf86cd799439052',
        tenantId: TENANT_ID,
        userId: ADMIN_USER_ID,
        type: 'order_shipped',
        title: 'Order Shipped',
        message: 'Order ORD-2024-002 has been shipped and is on its way',
        priority: 'low',
        isRead: false,
        metadata: {
          orderId: '507f1f77bcf86cd799439042',
          orderNumber: 'ORD-2024-002',
          trackingNumber: 'TRK-123456789'
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        _id: '507f1f77bcf86cd799439053',
        tenantId: TENANT_ID,
        userId: ADMIN_USER_ID,
        type: 'vendor_performance',
        title: 'Vendor Performance Update',
        message: 'Fresh Farms Supplier performance score improved to 4.5/5.0',
        priority: 'low',
        isRead: true,
        metadata: {
          vendorId: '507f1f77bcf86cd799439011',
          vendorName: 'Fresh Farms Supplier',
          newScore: 4.5,
          previousScore: 4.3
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    await db.collection('notifications').insertMany(notifications);
    console.log('Created sample notifications');
    
    console.log('\n✅ Database seeded successfully with demo data!');
    console.log('\n📊 Summary:');
    console.log(`- 1 Admin User (admin@demo-food.com / Admin123!)`);
    console.log(`- 3 Vendors (Fresh Farms, Global Electronics, Industrial Materials)`);
    console.log(`- 3 Suppliers (Same as vendors for demo)`);
    console.log(`- 5 Inventory Items (Tomatoes, Carrots, Headphones, Cable, Bolts)`);
    console.log(`- 3 Orders (1 Delivered, 1 Shipped, 1 Placed)`);
    console.log(`- 3 Notifications (Stock alerts, order updates)`);
    console.log('\n🌐 You can now login and see data in all modules!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase(); 