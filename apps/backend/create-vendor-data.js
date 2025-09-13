const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0';

async function createVendorData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find the vendor user
    const vendorUser = await db.collection('users').findOne({ email: 'vendor@test.com' });
    if (!vendorUser) {
      console.error('Vendor user not found. Please create vendor@test.com first.');
      return;
    }
    
    console.log('Found vendor user:', vendorUser.email);
    const vendorId = vendorUser._id.toString();
    const tenantId = vendorUser.tenantId;
    
    // Clear existing data for this vendor
    await db.collection('inventories').deleteMany({ vendorId, tenantId });
    await db.collection('orders').deleteMany({ vendorId, tenantId });
    await db.collection('suppliers').deleteMany({ vendorId, tenantId });
    
    console.log('Cleared existing vendor data');
    
    // Create suppliers
    const suppliers = [
      {
        _id: new ObjectId(),
        supplierCode: 'TECH001',
        name: 'TechSupply Co.',
        email: 'orders@techsupply.com',
        phone: '+1-555-0101',
        address: '123 Tech Street, Silicon Valley, CA 94000',
        contactPerson: 'John Smith',
        paymentTerms: '30 days',
        leadTime: 7,
        rating: 4.5,
        status: 'active',
        vendorId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        supplierCode: 'GLOBAL001',
        name: 'Global Electronics Ltd.',
        email: 'procurement@globalelec.com',
        phone: '+1-555-0202',
        address: '456 Component Ave, Austin, TX 78701',
        contactPerson: 'Sarah Johnson',
        paymentTerms: '45 days',
        leadTime: 14,
        rating: 4.2,
        status: 'active',
        vendorId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('suppliers').insertMany(suppliers);
    console.log('Created suppliers');
    
    // Create inventory items with historical data simulation
    const inventoryItems = [
      {
        _id: new ObjectId(),
        itemId: 'LAPTOP_001',
        name: 'Business Laptop - Dell Inspiron 15',
        description: 'High-performance laptop for business use',
        category: 'Electronics',
        sku: 'DELL-INS-15-001',
        currentStock: 45,
        minStockLevel: 10,
        maxStockLevel: 100,
        reorderPoint: 15,
        unitCost: 899.99,
        sellingPrice: 1299.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 7,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'MOUSE_001',
        name: 'Wireless Mouse - Logitech MX Master 3',
        description: 'Premium wireless mouse for productivity',
        category: 'Electronics',
        sku: 'LOG-MX3-001',
        currentStock: 120,
        minStockLevel: 25,
        maxStockLevel: 200,
        reorderPoint: 35,
        unitCost: 69.99,
        sellingPrice: 99.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 5,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'MONITOR_001',
        name: '24" 4K Monitor - Samsung UR59C',
        description: '24-inch 4K curved monitor',
        category: 'Electronics',
        sku: 'SAM-UR59C-001',
        currentStock: 28,
        minStockLevel: 8,
        maxStockLevel: 50,
        reorderPoint: 12,
        unitCost: 249.99,
        sellingPrice: 349.99,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        leadTime: 14,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'KEYBOARD_001',
        name: 'Mechanical Keyboard - Corsair K95',
        description: 'RGB mechanical gaming keyboard',
        category: 'Electronics',
        sku: 'COR-K95-001',
        currentStock: 65,
        minStockLevel: 15,
        maxStockLevel: 100,
        reorderPoint: 25,
        unitCost: 149.99,
        sellingPrice: 199.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 7,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'TABLET_001',
        name: 'iPad Air 10.9-inch',
        description: 'Apple iPad Air with 256GB storage',
        category: 'Electronics',
        sku: 'APPLE-IPAD-AIR-001',
        currentStock: 18,
        minStockLevel: 5,
        maxStockLevel: 40,
        reorderPoint: 8,
        unitCost: 549.99,
        sellingPrice: 749.99,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        leadTime: 14,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('inventories').insertMany(inventoryItems);
    console.log('Created inventory items');
    
    // Create historical orders (last 90 days)
    const orders = [];
    const orderStatuses = ['completed', 'completed', 'completed', 'shipped', 'processing'];
    
    // Generate orders for the last 90 days
    for (let daysAgo = 1; daysAgo <= 90; daysAgo++) {
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // More frequent orders in recent days, seasonal patterns
      const isWeekend = orderDate.getDay() === 0 || orderDate.getDay() === 6;
      const orderProbability = isWeekend ? 0.3 : 0.7; // Less orders on weekends
      
      if (Math.random() < orderProbability) {
        // Randomly select 1-3 items per order
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedItems = [];
        const orderItems = [];
        let totalAmount = 0;
        
        for (let i = 0; i < numItems; i++) {
          const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
          if (!selectedItems.includes(item.itemId)) {
            selectedItems.push(item.itemId);
            
            // Realistic quantity based on item type
            let quantity;
            if (item.itemId.includes('LAPTOP') || item.itemId.includes('MONITOR') || item.itemId.includes('TABLET')) {
              quantity = Math.floor(Math.random() * 3) + 1; // 1-3 for expensive items
            } else {
              quantity = Math.floor(Math.random() * 8) + 2; // 2-9 for accessories
            }
            
            const itemTotal = item.sellingPrice * quantity;
            totalAmount += itemTotal;
            
            orderItems.push({
              itemId: item.itemId,
              itemName: item.name,
              quantity,
              unitPrice: item.sellingPrice,
              totalPrice: itemTotal,
              sku: item.sku
            });
          }
        }
        
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        orders.push({
          _id: new ObjectId(),
          orderId,
          customerName: `Customer ${Math.floor(Math.random() * 1000) + 1}`,
          customerEmail: `customer${Math.floor(Math.random() * 1000) + 1}@example.com`,
          items: orderItems,
          totalAmount,
          status: daysAgo <= 3 ? orderStatuses[Math.floor(Math.random() * orderStatuses.length)] : 'completed',
          orderDate,
          deliveryDate: daysAgo <= 3 ? null : new Date(orderDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000),
          vendorId,
          tenantId,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }
    
    await db.collection('orders').insertMany(orders);
    console.log(`Created ${orders.length} historical orders`);
    
    // Create some purchase orders for restocking
    const purchaseOrders = [
      {
        _id: new ObjectId(),
        poNumber: `PO-${Date.now()}-001`,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        items: [
          {
            itemId: 'LAPTOP_001',
            itemName: 'Business Laptop - Dell Inspiron 15',
            quantity: 20,
            unitCost: 899.99,
            totalCost: 17999.80
          },
          {
            itemId: 'MOUSE_001',
            itemName: 'Wireless Mouse - Logitech MX Master 3',
            quantity: 50,
            unitCost: 69.99,
            totalCost: 3499.50
          }
        ],
        totalAmount: 21499.30,
        status: 'approved',
        orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        vendorId,
        tenantId,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        poNumber: `PO-${Date.now()}-002`,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        items: [
          {
            itemId: 'MONITOR_001',
            itemName: '24" 4K Monitor - Samsung UR59C',
            quantity: 15,
            unitCost: 249.99,
            totalCost: 3749.85
          }
        ],
        totalAmount: 3749.85,
        status: 'pending',
        orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        vendorId,
        tenantId,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('purchaseorders').insertMany(purchaseOrders);
    console.log('Created purchase orders');
    
    // Create some payment records
    const payments = [];
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Create payments for random completed orders
    for (let i = 0; i < Math.min(20, completedOrders.length); i++) {
      const order = completedOrders[i];
      payments.push({
        _id: new ObjectId(),
        paymentId: `PAY-${Date.now()}-${i}`,
        orderId: order.orderId,
        amount: order.totalAmount,
        paymentMethod: ['credit_card', 'bank_transfer', 'paypal'][Math.floor(Math.random() * 3)],
        status: 'completed',
        paymentDate: new Date(order.orderDate.getTime() + 24 * 60 * 60 * 1000), // Next day
        vendorId,
        tenantId,
        createdAt: new Date(order.orderDate.getTime() + 24 * 60 * 60 * 1000),
        updatedAt: new Date(order.orderDate.getTime() + 24 * 60 * 60 * 1000)
      });
    }
    
    await db.collection('payments').insertMany(payments);
    console.log(`Created ${payments.length} payment records`);
    
    // Summary
    console.log('\n=== VENDOR DATA CREATED SUCCESSFULLY ===');
    console.log(`Vendor: ${vendorUser.email} (${vendorId})`);
    console.log(`Tenant: ${tenantId}`);
    console.log(`Suppliers: ${suppliers.length}`);
    console.log(`Inventory Items: ${inventoryItems.length}`);
    console.log(`Historical Orders: ${orders.length} (last 90 days)`);
    console.log(`Purchase Orders: ${purchaseOrders.length}`);
    console.log(`Payment Records: ${payments.length}`);
    console.log('\nInventory Items Created:');
    inventoryItems.forEach(item => {
      console.log(`- ${item.name} (${item.itemId}): ${item.currentStock} units in stock`);
    });
    console.log('\n✅ Ready for accurate forecasting!');
    
  } catch (error) {
    console.error('Error creating vendor data:', error);
  } finally {
    await client.close();
  }
}

createVendorData(); 