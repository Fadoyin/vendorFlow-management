const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0';

async function createSampleData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB vendor_management database');
    
    const db = client.db();
    
    // Find the vendor user
    const vendorUser = await db.collection('users').findOne({ email: 'fadoyint@gmail.com' });
    if (!vendorUser) {
      console.error('Vendor user fadoyint@gmail.com not found.');
      return;
    }
    
    console.log('Found vendor user:', vendorUser.email);
    const vendorId = vendorUser._id.toString();
    const tenantId = vendorUser.tenantId.toString();
    
    // Clear existing data for this vendor
    await db.collection('inventories').deleteMany({ vendorId, tenantId });
    await db.collection('orders').deleteMany({ vendorId, tenantId });
    await db.collection('suppliers').deleteMany({ vendorId, tenantId });
    
    console.log('Cleared existing vendor data');
    
    // Create suppliers
    const suppliers = [
      {
        _id: new ObjectId(),
        supplierCode: 'TECH_SUPPLY_001',
        name: 'TechSupply Solutions',
        email: 'orders@techsupply.com',
        phone: '+1-555-0101',
        address: '123 Technology Drive, Silicon Valley, CA 94000',
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
        supplierCode: 'GLOBAL_ELEC_001',
        name: 'Global Electronics Ltd.',
        email: 'procurement@globalelec.com',
        phone: '+1-555-0202',
        address: '456 Component Avenue, Austin, TX 78701',
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
    
    // Create inventory items with realistic data
    const inventoryItems = [
      {
        _id: new ObjectId(),
        itemId: 'LAPTOP_PRO_001',
        name: 'MacBook Pro 14" M3',
        description: 'High-performance laptop for professional use',
        category: 'Electronics',
        sku: 'APPLE-MBP-14-M3-001',
        currentStock: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        reorderPoint: 8,
        unitCost: 1899.99,
        sellingPrice: 2399.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 7,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'MOUSE_WIRELESS_001',
        name: 'Logitech MX Master 3S',
        description: 'Premium wireless mouse for productivity',
        category: 'Electronics',
        sku: 'LOG-MX3S-001',
        currentStock: 75,
        minStockLevel: 15,
        maxStockLevel: 100,
        reorderPoint: 20,
        unitCost: 79.99,
        sellingPrice: 109.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 5,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'MONITOR_4K_001',
        name: '27" 4K Monitor - LG UltraFine',
        description: '27-inch 4K UHD monitor for professional work',
        category: 'Electronics',
        sku: 'LG-UF27-4K-001',
        currentStock: 15,
        minStockLevel: 3,
        maxStockLevel: 25,
        reorderPoint: 5,
        unitCost: 399.99,
        sellingPrice: 549.99,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        leadTime: 14,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'KEYBOARD_MECH_001',
        name: 'Mechanical Keyboard - Keychron K2',
        description: 'Wireless mechanical keyboard with RGB',
        category: 'Electronics',
        sku: 'KEY-K2-RGB-001',
        currentStock: 40,
        minStockLevel: 8,
        maxStockLevel: 60,
        reorderPoint: 12,
        unitCost: 89.99,
        sellingPrice: 129.99,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        leadTime: 7,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        itemId: 'TABLET_IPAD_001',
        name: 'iPad Air 11" M2',
        description: 'Apple iPad Air with M2 chip and 256GB storage',
        category: 'Electronics',
        sku: 'APPLE-IPAD-AIR-M2-001',
        currentStock: 12,
        minStockLevel: 3,
        maxStockLevel: 20,
        reorderPoint: 5,
        unitCost: 699.99,
        sellingPrice: 899.99,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        leadTime: 14,
        vendorId,
        tenantId,
        status: 'active',
        lastRestocked: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('inventories').insertMany(inventoryItems);
    console.log('Created inventory items');
    
    // Create historical orders (last 90 days)
    const orders = [];
    const orderStatuses = ['completed', 'completed', 'completed', 'shipped', 'processing'];
    
    // Generate realistic orders for the last 90 days
    for (let daysAgo = 1; daysAgo <= 90; daysAgo++) {
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // More frequent orders on weekdays, seasonal patterns
      const isWeekend = orderDate.getDay() === 0 || orderDate.getDay() === 6;
      const orderProbability = isWeekend ? 0.2 : 0.6; // Fewer orders on weekends
      
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
            
            // Realistic quantity based on item type and price
            let quantity;
            if (item.itemId.includes('LAPTOP') || item.itemId.includes('MONITOR') || item.itemId.includes('TABLET')) {
              quantity = Math.floor(Math.random() * 2) + 1; // 1-2 for expensive items
            } else {
              quantity = Math.floor(Math.random() * 5) + 1; // 1-5 for accessories
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
          customerName: `Customer ${Math.floor(Math.random() * 500) + 1}`,
          customerEmail: `customer${Math.floor(Math.random() * 500) + 1}@company.com`,
          items: orderItems,
          totalAmount,
          status: daysAgo <= 3 ? orderStatuses[Math.floor(Math.random() * orderStatuses.length)] : 'completed',
          orderDate,
          deliveryDate: daysAgo <= 3 ? null : new Date(orderDate.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000),
          vendorId,
          tenantId,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }
    
    await db.collection('orders').insertMany(orders);
    console.log(`Created ${orders.length} historical orders`);
    
    // Create purchase orders for restocking
    const purchaseOrders = [
      {
        _id: new ObjectId(),
        poNumber: `PO-${Date.now()}-001`,
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        items: [
          {
            itemId: 'LAPTOP_PRO_001',
            itemName: 'MacBook Pro 14" M3',
            quantity: 10,
            unitCost: 1899.99,
            totalCost: 18999.90
          },
          {
            itemId: 'MOUSE_WIRELESS_001',
            itemName: 'Logitech MX Master 3S',
            quantity: 25,
            unitCost: 79.99,
            totalCost: 1999.75
          }
        ],
        totalAmount: 20999.65,
        status: 'approved',
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        vendorId,
        tenantId,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        poNumber: `PO-${Date.now()}-002`,
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        items: [
          {
            itemId: 'MONITOR_4K_001',
            itemName: '27" 4K Monitor - LG UltraFine',
            quantity: 8,
            unitCost: 399.99,
            totalCost: 3199.92
          }
        ],
        totalAmount: 3199.92,
        status: 'pending',
        orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        vendorId,
        tenantId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('purchaseorders').insertMany(purchaseOrders);
    console.log('Created purchase orders');
    
    // Create payment records
    const payments = [];
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Create payments for random completed orders
    for (let i = 0; i < Math.min(15, completedOrders.length); i++) {
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
    console.log('\n=== SAMPLE DATA CREATED SUCCESSFULLY ===');
    console.log(`Vendor: ${vendorUser.email} (${vendorId})`);
    console.log(`Company: ${vendorUser.companyName}`);
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
    console.log('\n✅ Ready for real forecasting with vendor_management database!');
    console.log(`\nLogin with: ${vendorUser.email} / [your password]`);
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await client.close();
  }
}

createSampleData(); 