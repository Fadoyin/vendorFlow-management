const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority';

async function createTestOrders() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('vendor_management');
    
    // Find admin user to get tenant ID
    const adminUser = await db.collection('users').findOne({ email: 'fadoyint@gmail.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('Admin user found:', adminUser.email);
    console.log('Tenant ID:', adminUser.tenantId);
    
    // Find vendor and supplier
    let vendor = await db.collection('vendors').findOne({ tenantId: adminUser.tenantId });
    let supplier = await db.collection('suppliers').findOne({ tenantId: adminUser.tenantId });
    
    console.log('Vendor found:', vendor ? vendor.name : 'None');
    console.log('Supplier found:', supplier ? supplier.supplierName : 'None');
    
    // Check existing orders
    const existingOrders = await db.collection('orders').countDocuments({ 
      tenantId: adminUser.tenantId 
    });
    console.log('Existing orders:', existingOrders);
    
    if (existingOrders > 0) {
      console.log('✅ Orders already exist');
      // Show existing orders with vendor info
      const orders = await db.collection('orders')
        .find({ tenantId: adminUser.tenantId })
        .limit(3)
        .toArray();
      
      console.log('\nExisting orders:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderId || order._id} - Status: ${order.status}`);
      });
      return;
    }
    
    if (!vendor || !supplier) {
      console.log('❌ Cannot create orders - missing vendor or supplier');
      
      // Create vendor if missing
      if (!vendor) {
        const newVendor = {
          name: 'Tech Solutions Ltd',
          vendorCode: 'TECH001',
          tenantId: adminUser.tenantId,
          status: 'active',
          category: 'technology',
          address: {
            street: '123 Tech Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'USA'
          },
          contacts: [{
            name: 'John Tech',
            email: 'john@techsolutions.com',
            phone: '+1-555-0123',
            role: 'Sales Manager'
          }],
          paymentTerms: 'NET_30',
          creditLimit: 50000,
          currentBalance: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const vendorResult = await db.collection('vendors').insertOne(newVendor);
        console.log('✅ Created vendor:', vendorResult.insertedId);
        vendor = { _id: vendorResult.insertedId, ...newVendor };
      }
      
      // Create supplier if missing
      if (!supplier) {
        const newSupplier = {
          supplierName: 'Office Supplies Inc',
          supplierCode: 'SUP001',
          tenantId: adminUser.tenantId,
          status: 'active',
          category: 'office_supplies',
          email: 'orders@officesupplies.com',
          phone: '+1-555-0456',
          address: '456 Supply Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          contactPerson: 'Jane Supplier',
          contactEmail: 'jane@officesupplies.com',
          contactPhone: '+1-555-0456',
          paymentTerms: 'Net 30',
          creditLimit: 25000,
          rating: 4.5,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const supplierResult = await db.collection('suppliers').insertOne(newSupplier);
        console.log('✅ Created supplier:', supplierResult.insertedId);
        supplier = { _id: supplierResult.insertedId, ...newSupplier };
      }
    }
    
    // Create sample orders
    console.log('Creating sample orders...');
    const now = Date.now();
    const orders = [
      {
        orderId: `ORD-${now}-001`,
        orderNumber: 'ORD-001',
        vendorId: new ObjectId(vendor._id),
        supplierId: new ObjectId(supplier._id),
        tenantId: new ObjectId(adminUser.tenantId),
        items: [
          { 
            itemName: 'Laptop Pro 15', 
            quantity: 2, 
            unitPrice: 1299.99, 
            totalPrice: 2599.98,
            description: 'High-performance laptop for business use'
          },
          { 
            itemName: 'Wireless Mouse', 
            quantity: 5, 
            unitPrice: 29.99, 
            totalPrice: 149.95,
            description: 'Ergonomic wireless mouse'
          }
        ],
        status: 'confirmed',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalAmount: 2749.93,
        subtotal: 2749.93,
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        currency: 'USD',
        paymentTerms: 'Net 30',
        notes: 'Standard business order',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUser._id
      },
      {
        orderId: `ORD-${now}-002`,
        orderNumber: 'ORD-002', 
        vendorId: new ObjectId(vendor._id),
        supplierId: new ObjectId(supplier._id),
        tenantId: new ObjectId(adminUser.tenantId),
        items: [
          { 
            itemName: 'Office Chair', 
            quantity: 10, 
            unitPrice: 199.99, 
            totalPrice: 1999.90,
            description: 'Ergonomic office chair with lumbar support'
          },
          {
            itemName: 'Desk Lamp',
            quantity: 10,
            unitPrice: 49.99,
            totalPrice: 499.90,
            description: 'LED desk lamp with adjustable brightness'
          }
        ],
        status: 'shipped',
        orderDate: new Date(Date.now() - 86400000), // Yesterday
        expectedDeliveryDate: new Date(Date.now() + 172800000), // In 2 days
        totalAmount: 2499.80,
        subtotal: 2499.80,
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        currency: 'USD',
        notes: 'Urgent delivery required for new office setup',
        paymentTerms: 'Net 30',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
        createdBy: adminUser._id
      },
      {
        orderId: `ORD-${now}-003`,
        orderNumber: 'ORD-003',
        vendorId: new ObjectId(vendor._id),
        supplierId: new ObjectId(supplier._id),
        tenantId: new ObjectId(adminUser.tenantId),
        items: [
          { 
            itemName: 'Monitor 27"', 
            quantity: 5, 
            unitPrice: 299.99, 
            totalPrice: 1499.95,
            description: '4K Ultra HD monitor'
          }
        ],
        status: 'pending',
        orderDate: new Date(Date.now() - 3600000), // 1 hour ago
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        totalAmount: 1499.95,
        subtotal: 1499.95,
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        currency: 'USD',
        paymentTerms: 'Net 15',
        notes: 'Monitor upgrade for development team',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(),
        createdBy: adminUser._id
      }
    ];
    
    const result = await db.collection('orders').insertMany(orders);
    console.log(`✅ Created ${result.insertedCount} sample orders`);
    
    // Display created orders
    console.log('\nCreated orders:');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderId} - ${order.status} - $${order.totalAmount}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

createTestOrders(); 