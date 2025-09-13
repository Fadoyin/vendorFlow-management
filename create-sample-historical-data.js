const { MongoClient, ObjectId } = require('mongodb');

async function createSampleHistoricalData() {
  console.log('🔧 Creating sample historical data for realistic forecasting...');
  
  const client = new MongoClient('mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0');
  await client.connect();
  const db = client.db();
  
  try {
    // Get admin user and tenant info
    const adminUser = await db.collection('users').findOne({email: 'jovidir840@obirah.com'});
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const tenantId = adminUser.tenantId;
    console.log('📋 Creating data for tenant:', tenantId);
    
    // Get existing inventory items
    const items = await db.collection('items').find({
      tenantId: tenantId,
      isDeleted: false
    }).toArray();
    
    if (items.length === 0) {
      console.log('❌ No inventory items found for tenant');
      return;
    }
    
    console.log('📦 Found', items.length, 'inventory items');
    
    // Create sample vendors for orders
    const vendors = [];
    for (let i = 1; i <= 3; i++) {
      const vendor = {
        _id: new ObjectId(),
        tenantId: tenantId,
        name: `Sample Vendor ${i}`,
        vendorCode: `VENDOR${i}`,
        email: `vendor${i}@sample.com`,
        phone: `+1234567890${i}`,
        address: `${i}00 Sample Street, City, State 1234${i}`,
        status: 'active',
        contactPerson: `Contact Person ${i}`,
        paymentTerms: '30 days',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };
      vendors.push(vendor);
    }
    
    console.log('🏢 Creating sample vendors...');
    await db.collection('vendors').insertMany(vendors);
    
    // Create historical orders for the past 90 days
    const orders = [];
    const today = new Date();
    
    console.log('📊 Generating historical orders for past 90 days...');
    
    for (let dayOffset = 90; dayOffset > 0; dayOffset--) {
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - dayOffset);
      
      // Skip some days randomly to create realistic gaps
      if (Math.random() < 0.3) continue;
      
      // Create 1-3 orders per day
      const ordersPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let orderIndex = 0; orderIndex < ordersPerDay; orderIndex++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const orderItems = [];
        let totalAmount = 0;
        
        // Add 1-4 items per order
        const itemsInOrder = Math.floor(Math.random() * 4) + 1;
        const usedItems = new Set();
        
        for (let itemIndex = 0; itemIndex < itemsInOrder; itemIndex++) {
          let randomItem;
          do {
            randomItem = items[Math.floor(Math.random() * items.length)];
          } while (usedItems.has(randomItem._id.toString()) && usedItems.size < items.length);
          
          usedItems.add(randomItem._id.toString());
          
          const quantity = Math.floor(Math.random() * 20) + 1;
          const unitPrice = 50 + Math.random() * 200; // $50-$250 per item
          const itemTotal = quantity * unitPrice;
          
          orderItems.push({
            itemId: randomItem._id,
            itemName: randomItem.name,
            quantity: quantity,
            unitPrice: Math.round(unitPrice * 100) / 100,
            totalPrice: Math.round(itemTotal * 100) / 100
          });
          
          totalAmount += itemTotal;
        }
        
        const orderId = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(orderIndex + 1).padStart(3, '0')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const order = {
          _id: new ObjectId(),
          tenantId: tenantId,
          orderId: orderId,
          vendorId: vendor._id,
          supplierId: vendor._id, // Use vendor as supplier for simplicity
          orderDate: orderDate,
          expectedArrivalDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
          status: Math.random() < 0.8 ? 'completed' : (Math.random() < 0.5 ? 'pending' : 'shipped'),
          priority: Math.random() < 0.3 ? 'high' : (Math.random() < 0.6 ? 'medium' : 'low'),
          items: orderItems,
          subtotal: Math.round(totalAmount * 100) / 100,
          tax: Math.round(totalAmount * 0.08 * 100) / 100, // 8% tax
          shipping: Math.round((50 + Math.random() * 50) * 100) / 100, // $50-100 shipping
          discount: 0,
          totalAmount: Math.round((totalAmount * 1.08 + 50 + Math.random() * 50) * 100) / 100,
          currency: 'USD',
          notes: `Historical order for realistic forecasting`,
          attachments: [],
          isActive: true,
          statusHistory: [
            {
              status: 'pending',
              timestamp: orderDate,
              updatedBy: adminUser._id
            }
          ],
          createdAt: orderDate,
          updatedAt: orderDate
        };
        
        orders.push(order);
      }
    }
    
    console.log('💾 Inserting', orders.length, 'historical orders...');
    if (orders.length > 0) {
      await db.collection('orders').insertMany(orders);
    }
    
    // Create historical inventory movements
    const inventoryMovements = [];
    
    console.log('📈 Generating inventory movements...');
    
    for (let dayOffset = 90; dayOffset > 0; dayOffset--) {
      const movementDate = new Date(today);
      movementDate.setDate(today.getDate() - dayOffset);
      
      // Create random inventory movements
      items.forEach(item => {
        if (Math.random() < 0.4) { // 40% chance of movement per item per day
          const movementType = Math.random() < 0.6 ? 'out' : 'in'; // More outbound movements
          const quantity = Math.floor(Math.random() * 10) + 1;
          
          inventoryMovements.push({
            _id: new ObjectId(),
            itemId: item._id,
            tenantId: tenantId,
            movementType: movementType,
            quantity: quantity,
            reason: movementType === 'out' ? 'sale' : 'restock',
            date: movementDate,
            createdBy: adminUser._id,
            createdAt: movementDate,
            notes: 'Historical movement for forecasting'
          });
        }
      });
    }
    
    console.log('💾 Inserting', inventoryMovements.length, 'inventory movements...');
    if (inventoryMovements.length > 0) {
      await db.collection('inventory_movements').insertMany(inventoryMovements);
    }
    
    // Create historical cost/expense records
    const expenses = [];
    
    console.log('💰 Generating expense records...');
    
    for (let dayOffset = 90; dayOffset > 0; dayOffset--) {
      const expenseDate = new Date(today);
      expenseDate.setDate(today.getDate() - dayOffset);
      
      // Skip weekends for some expense types
      const isWeekend = expenseDate.getDay() === 0 || expenseDate.getDay() === 6;
      
      // Daily operational expenses
      if (!isWeekend || Math.random() < 0.3) {
        const expenseCategories = [
          { category: 'materials', baseAmount: 1000, variance: 500 },
          { category: 'labor', baseAmount: 2000, variance: 300 },
          { category: 'overhead', baseAmount: 800, variance: 200 },
          { category: 'utilities', baseAmount: 300, variance: 100 },
          { category: 'transportation', baseAmount: 400, variance: 200 }
        ];
        
        expenseCategories.forEach(expenseType => {
          if (Math.random() < 0.7) { // 70% chance of expense per category per day
            const amount = expenseType.baseAmount + (Math.random() - 0.5) * expenseType.variance;
            
            expenses.push({
              _id: new ObjectId(),
              tenantId: tenantId,
              category: expenseType.category,
              amount: Math.round(Math.max(amount, 50) * 100) / 100,
              date: expenseDate,
              description: `Daily ${expenseType.category} expense`,
              createdBy: adminUser._id,
              createdAt: expenseDate,
              isDeleted: false
            });
          }
        });
      }
    }
    
    console.log('💾 Inserting', expenses.length, 'expense records...');
    if (expenses.length > 0) {
      await db.collection('expenses').insertMany(expenses);
    }
    
    // Summary
    console.log('');
    console.log('✅ SAMPLE HISTORICAL DATA CREATED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - ${vendors.length} sample vendors`);
    console.log(`   - ${orders.length} historical orders`);
    console.log(`   - ${inventoryMovements.length} inventory movements`);
    console.log(`   - ${expenses.length} expense records`);
    console.log(`   - Data spans: 90 days (${new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toDateString()} to ${today.toDateString()})`);
    console.log('');
    console.log('🎯 Forecasting modules will now use this real historical data!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createSampleHistoricalData().catch(console.error); 