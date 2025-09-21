#!/usr/bin/env node

const axios = require('axios');

async function testForecastingPageData() {
  console.log('🔍 Debug: Testing Forecasting Page Data Loading\n');
  
  const frontendUrl = 'http://localhost:3005';
  const backendUrl = 'http://localhost:3004/api';
  
  console.log('1. Testing Frontend Availability...');
  try {
    const frontendResponse = await axios.get(frontendUrl);
    console.log('   ✅ Frontend is responding');
  } catch (error) {
    console.log('   ❌ Frontend not available:', error.message);
    return;
  }
  
  console.log('\n2. Testing Backend API Health...');
  try {
    const healthResponse = await axios.get(`${backendUrl}/health`);
    console.log('   ✅ Backend is healthy');
    console.log('   📊 Database:', healthResponse.data.details?.database?.status || 'unknown');
  } catch (error) {
    console.log('   ❌ Backend not healthy:', error.message);
    return;
  }
  
  console.log('\n3. Testing Inventory API (without auth)...');
  try {
    const inventoryResponse = await axios.get(`${backendUrl}/inventory`);
    console.log('   ✅ Inventory API responded');
    console.log('   📦 Items found:', inventoryResponse.data?.items?.length || 'unknown');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   🔐 Inventory API requires authentication (expected)');
      console.log('   📝 Error:', error.response?.data?.message);
    } else {
      console.log('   ❌ Inventory API error:', error.message);
    }
  }
  
  console.log('\n4. Checking Forecasting Page Content...');
  try {
    const pageResponse = await axios.get(`${frontendUrl}/dashboard/vendor/forecasting`);
    const pageContent = pageResponse.data;
    
    // Check for our enhanced content
    const hasEnhancedContent = pageContent.includes('Real data loaded') || 
                              pageContent.includes('loadRealInventoryData') ||
                              pageContent.includes('Recharts');
    
    if (hasEnhancedContent) {
      console.log('   ✅ Enhanced forecasting page detected');
    } else {
      console.log('   ⚠️  Page might be using old version');
    }
    
    // Check for chart libraries
    const hasChartLibrary = pageContent.includes('recharts') || 
                           pageContent.includes('chart');
    
    if (hasChartLibrary) {
      console.log('   📊 Chart library detected in page');
    } else {
      console.log('   📊 Chart library not detected');
    }
    
  } catch (error) {
    console.log('   ❌ Could not load forecasting page:', error.message);
  }
  
  console.log('\n5. Summary and Recommendations:');
  console.log('   📋 To see the enhanced forecasting page:');
  console.log('   1. Open browser: http://localhost:3005');
  console.log('   2. Login as a vendor user');
  console.log('   3. Navigate to: /dashboard/vendor/forecasting');
  console.log('   4. Clear browser cache (Ctrl+Shift+R)');
  console.log('   5. Look for "Real data loaded" indicator');
  
  console.log('\n6. Expected Behavior:');
  console.log('   🔸 If logged in: Real inventory data loads');
  console.log('   🔸 If not logged in: Falls back to sample data');
  console.log('   🔸 Charts: Interactive Recharts visualizations');
  console.log('   🔸 UI: Modern gradients and enhanced controls');
  
  console.log('\n7. Troubleshooting:');
  console.log('   🔧 If no changes visible:');
  console.log('      - Hard refresh browser (Ctrl+Shift+R)');
  console.log('      - Check browser console for errors');
  console.log('      - Ensure you have vendor role access');
  console.log('      - Verify cookies/authentication');
}

if (require.main === module) {
  testForecastingPageData().catch(console.error);
} 