const { MongoClient, ObjectId } = require('mongodb');

async function createSimpleHistoricalData() {
  console.log('🔧 Creating simplified historical data for forecasting...');
  
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
    
    // Create sample vendor first
    const vendor = {
      _id: new ObjectId(),
      tenantId: tenantId,
      name: 'Sample Supplier Corp',
      vendorCode: 'SUPPLIER001',
      email: 'supplier@sample.com',
      phone: '+1234567890',
      address: '123 Business St, City, State 12345',
      status: 'active',
      contactPerson: 'John Supplier',
      paymentTerms: '30 days',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };
    
    console.log('🏢 Creating sample vendor...');
    await db.collection('vendors').insertOne(vendor);
    
    // Create historical orders with proper structure
    const orders = [];
    const today = new Date();
    
    console.log('📊 Generating 50 historical orders...');
    
    for (let i = 1; i <= 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
      const orderDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const baseAmount = 500 + Math.random() * 2000; // $500-$2500 per order
      const tax = baseAmount * 0.08;
      const shipping = 25 + Math.random() * 75;
      const totalAmount = baseAmount + tax + shipping;
      
      const order = {
        _id: new ObjectId(),
        tenantId: tenantId,
        orderId: `HIST-${Date.now()}-${i.toString().padStart(3, '0')}`,
        vendorId: vendor._id,
        supplierId: vendor._id,
        orderDate: orderDate,
        expectedArrivalDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        priority: 'medium',
        items: [
          {
            itemId: new ObjectId(),
            itemName: `Sample Item ${i}`,
            quantity: Math.floor(Math.random() * 20) + 1,
            unitPrice: Math.round((50 + Math.random() * 100) * 100) / 100,
            totalPrice: Math.round(baseAmount * 100) / 100
          }
        ],
        subtotal: Math.round(baseAmount * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        discount: 0,
        totalAmount: Math.round(totalAmount * 100) / 100,
        currency: 'USD',
        notes: 'Historical order for forecasting',
        attachments: [],
        isActive: true,
        statusHistory: [
          {
            status: 'completed',
            timestamp: orderDate,
            updatedBy: adminUser._id
          }
        ],
        createdAt: orderDate,
        updatedAt: orderDate
      };
      
      orders.push(order);
    }
    
    console.log('💾 Inserting orders...');
    await db.collection('orders').insertMany(orders);
    
    // Create expenses/costs data
    const expenses = [];
    
    console.log('💰 Generating expense records...');
    
    for (let dayOffset = 90; dayOffset > 0; dayOffset--) {
      const expenseDate = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      // Daily operational costs
      const dailyCost = 1000 + Math.random() * 2000; // $1000-$3000 per day
      
      expenses.push({
        _id: new ObjectId(),
        tenantId: tenantId,
        category: 'operations',
        amount: Math.round(dailyCost * 100) / 100,
        date: expenseDate,
        description: 'Daily operational expenses',
        createdBy: adminUser._id,
        createdAt: expenseDate,
        isDeleted: false
      });
    }
    
    console.log('💾 Inserting expenses...');
    await db.collection('expenses').insertMany(expenses);
    
    // Summary
    console.log('');
    console.log('✅ HISTORICAL DATA CREATED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - 1 sample vendor created`);
    console.log(`   - ${orders.length} historical orders created`);
    console.log(`   - ${expenses.length} expense records created`);
    console.log(`   - Total order value: $${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}`);
    console.log('');
    console.log('🎯 Forecasting modules can now use this real data!');
    
  } catch (error) {
    console.error('❌ Error creating historical data:', error);
  } finally {
    await client.close();
  }
}

createSimpleHistoricalData().catch(console.error); 