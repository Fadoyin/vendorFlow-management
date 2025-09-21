#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Add auth token if needed - will be set when we test with real auth
    'Authorization': ''
  }
};

async function testForecastingEndpoints() {
  console.log('🧪 Testing VendorFlow Forecasting API Endpoints...\n');

  // Test data
  const costForecastData = {
    forecastMonths: 6,
    modelType: 'seasonal',
    baseMonthlyBudget: 10000,
    includeSeasonalFactors: true,
    riskLevel: 3
  };

  const inventoryForecastData = {
    forecastPeriod: 30,
    includeSeasonality: true,
    safetyStockMultiplier: 1.5,
    inventoryItems: [
      {
        itemId: 'test-item-1',
        itemName: 'Test Product A',
        currentStock: 150,
        reorderLevel: 50,
        leadTime: 7,
        category: 'Electronics',
        unitCost: 25.50,
        minOrderQuantity: 100
      }
    ]
  };

  const demandForecastData = {
    forecastPeriod: 90,
    modelType: 'auto',
    confidenceLevel: 0.95,
    includeExternalFactors: true,
    historicalWindow: 365,
    itemIds: ['test-item-1', 'test-item-2']
  };

  const tests = [
    {
      name: 'Cost Forecast Generation',
      method: 'POST',
      url: `${BASE_URL}/forecasts/cost-forecast`,
      data: costForecastData
    },
    {
      name: 'Inventory Forecast Generation',
      method: 'POST',
      url: `${BASE_URL}/forecasts/inventory-forecast`,
      data: inventoryForecastData
    },
    {
      name: 'Demand Forecast Generation',
      method: 'POST',
      url: `${BASE_URL}/forecasts/demand-forecast`,
      data: demandForecastData
    },
    {
      name: 'Get All Forecasts',
      method: 'GET',
      url: `${BASE_URL}/forecasts`,
      data: null
    },
    {
      name: 'Get Inventory Items',
      method: 'GET',
      url: `${BASE_URL}/inventory`,
      data: null
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);

      const config = {
        method: test.method.toLowerCase(),
        url: test.url,
        ...testConfig
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      console.log(`   ✅ Success: ${response.status} ${response.statusText}`);
      console.log(`   📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      
      // Log some response details for debugging
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   📋 Returned ${response.data.length} items`);
        } else if (typeof response.data === 'object') {
          const keys = Object.keys(response.data);
          console.log(`   🔑 Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }
      }
      
      successCount++;
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.status || 'Network Error'} ${error.response?.statusText || error.message}`);
      
      if (error.response?.data) {
        console.log(`   💬 Error details: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
      
      console.log('');
    }
  }

  console.log('📈 Test Summary:');
  console.log(`   ✅ Passed: ${successCount}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`   📊 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  if (successCount === totalTests) {
    console.log('\n🎉 All tests passed! Forecasting API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend server and API implementation.');
  }
}

async function testBackendHealth() {
  console.log('🏥 Testing Backend Health...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, testConfig);
    console.log('✅ Backend is healthy!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed!');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 VendorFlow Forecasting API Test Suite\n');
  console.log('=' * 50);
  
  // First check if backend is running
  const isHealthy = await testBackendHealth();
  console.log('');
  
  if (!isHealthy) {
    console.log('⚠️  Backend appears to be down. Please start the backend server:');
    console.log('   cd apps/backend && npm run start:dev');
    process.exit(1);
  }
  
  // Run forecasting tests
  await testForecastingEndpoints();
  
  console.log('\n💡 Tips:');
  console.log('   - Make sure you have valid authentication tokens if required');
  console.log('   - Check that all forecast modules are properly imported');
  console.log('   - Verify database connections are working');
  console.log('   - Ensure real data exists for meaningful forecasts');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testForecastingEndpoints,
  testBackendHealth
}; 