const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function fixAllObjectIds() {
  const client = new MongoClient('mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin');
  
  try {
    await client.connect();
    const db = client.db();
    
    // Generate completely new valid ObjectIds
    const TENANT_ID = new ObjectId();
    const ADMIN_USER_ID = new ObjectId();
    const VENDOR_1_ID = new ObjectId();
    const VENDOR_2_ID = new ObjectId();
    const VENDOR_3_ID = new ObjectId();
    const SUPPLIER_1_ID = new ObjectId();
    const SUPPLIER_2_ID = new ObjectId();
    const SUPPLIER_3_ID = new ObjectId();
    const ITEM_1_ID = new ObjectId();
    const ITEM_2_ID = new ObjectId();
    const ITEM_3_ID = new ObjectId();
    const ORDER_1_ID = new ObjectId();
    const ORDER_2_ID = new ObjectId();
    const ORDER_3_ID = new ObjectId();
    
    console.log('Generated valid ObjectIds:');
    console.log('TENANT_ID:', TENANT_ID.toString());
    console.log('ADMIN_USER_ID:', ADMIN_USER_ID.toString());
    
    // Clear all collections
    await db.collection('users').deleteMany({});
    await db.collection('vendors').deleteMany({});
    await db.collection('suppliers').deleteMany({});
    await db.collection('items').deleteMany({});
    await db.collection('orders').deleteMany({});
    console.log('Cleared all collections');
    
    // Create admin user with proper ObjectIds
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
    console.log('Created admin user with valid ObjectIds');
    
    // Create vendors with proper ObjectIds
    const vendors = [
      {
        _id: VENDOR_1_ID,
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
        _id: VENDOR_2_ID,
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
        _id: VENDOR_3_ID,
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
    console.log('Created vendors with valid ObjectIds');
    
    // Create suppliers (same as vendors for demo)
    const suppliers = [
      {
        _id: SUPPLIER_1_ID,
        tenantId: TENANT_ID,
        supplierCode: 'SUPP-001',
        name: 'Fresh Farms Supplier',
        category: 'agriculture',
        type: 'supplier',
        status: 'active',
        primaryContact: vendors[0].primaryContact,
        address: vendors[0].address,
        businessInfo: vendors[0].businessInfo,
        performance: vendors[0].performance,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: SUPPLIER_2_ID,
        tenantId: TENANT_ID,
        supplierCode: 'SUPP-002',
        name: 'Global Electronics Inc',
        category: 'technology',
        type: 'supplier',
        status: 'active',
        primaryContact: vendors[1].primaryContact,
        address: vendors[1].address,
        businessInfo: vendors[1].businessInfo,
        performance: vendors[1].performance,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: SUPPLIER_3_ID,
        tenantId: TENANT_ID,
        supplierCode: 'SUPP-003',
        name: 'Industrial Materials Corp',
        category: 'manufacturing',
        type: 'supplier',
        status: 'active',
        primaryContact: vendors[2].primaryContact,
        address: vendors[2].address,
        businessInfo: vendors[2].businessInfo,
        performance: vendors[2].performance,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('suppliers').insertMany(suppliers);
    console.log('Created suppliers with valid ObjectIds');
    
    // Create inventory items with proper ObjectIds
    const items = [
      {
        _id: ITEM_1_ID,
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
          vendorId: VENDOR_1_ID,
          vendorName: 'Fresh Farms Supplier',
          leadTime: 2
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: ITEM_2_ID,
        tenantId: TENANT_ID,
        name: 'Wireless Bluetooth Headphones',
        sku: 'ELEC-HEAD-001',
        category: 'electronics',
        description: 'High-quality wireless Bluetooth headphones',
        tags: ['electronics', 'audio', 'wireless'],
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
          vendorId: VENDOR_2_ID,
          vendorName: 'Global Electronics Inc',
          leadTime: 5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: ITEM_3_ID,
        tenantId: TENANT_ID,
        name: 'Stainless Steel Bolts',
        sku: 'MFG-BOLT-001',
        category: 'hardware',
        description: 'High-grade stainless steel bolts, M8 x 20mm',
        tags: ['hardware', 'bolts', 'manufacturing'],
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
          vendorId: VENDOR_3_ID,
          vendorName: 'Industrial Materials Corp',
          leadTime: 7
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('items').insertMany(items);
    console.log('Created inventory items with valid ObjectIds');
    
    // Create orders with proper ObjectIds
    const orders = [
      {
        _id: ORDER_1_ID,
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-001',
        vendorId: VENDOR_1_ID,
        supplierId: SUPPLIER_1_ID,
        status: 'delivered',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expectedArrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualArrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: ITEM_1_ID,
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
        _id: ORDER_2_ID,
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-002',
        vendorId: VENDOR_2_ID,
        supplierId: SUPPLIER_2_ID,
        status: 'shipped',
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedArrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: ITEM_2_ID,
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
        notes: 'Electronics bulk order',
        createdBy: ADMIN_USER_ID,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        _id: ORDER_3_ID,
        tenantId: TENANT_ID,
        orderId: 'ORD-2024-003',
        vendorId: VENDOR_3_ID,
        supplierId: SUPPLIER_3_ID,
        status: 'placed',
        orderDate: new Date(),
        expectedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryId: ITEM_3_ID,
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
    console.log('Created orders with valid ObjectIds');
    
    console.log('\n✅ ALL OBJECTIDS FIXED SUCCESSFULLY!');
    console.log('\n📊 Updated Data:');
    console.log(`- TENANT_ID: ${TENANT_ID.toString()}`);
    console.log(`- ADMIN_USER_ID: ${ADMIN_USER_ID.toString()}`);
    console.log('- 1 Admin User (admin@demo-food.com / Admin123!)');
    console.log('- 3 Vendors with valid ObjectIds');
    console.log('- 3 Suppliers with valid ObjectIds');
    console.log('- 3 Inventory Items with valid ObjectIds');
    console.log('- 3 Orders with valid ObjectIds');
    console.log('\n🌐 All API endpoints should now work correctly!');
    
  } catch (error) {
    console.error('❌ Error fixing ObjectIds:', error);
  } finally {
    await client.close();
  }
}

fixAllObjectIds(); 