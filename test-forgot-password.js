const axios = require('axios');

async function testForgotPassword() {
  try {
    console.log('Testing forgot password functionality...');
    
    const response = await axios.post('http://localhost:3004/auth/forgot-password', {
      email: 'fadoyintaiwo01@gmail.com'
    });
    
    console.log('✅ Forgot password request successful:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

testForgotPassword();
