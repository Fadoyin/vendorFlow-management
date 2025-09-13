const nodemailer = require('nodemailer');

async function testGmailSMTP() {
  console.log('🧪 Testing Gmail SMTP Configuration...\n');
  
  const gmailUser = 'vendorflowteam@gmail.com';
  const gmailPass = 'jbafjcddqufitfds';  // App password
  
  console.log(`📧 Testing with Gmail account: ${gmailUser}`);
  console.log(`🔑 Using App Password: ${gmailPass.substring(0, 4)}...`);
  
  try {
    console.log('\n1️⃣ Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    
    console.log('✅ Transporter created');
    
    console.log('\n2️⃣ Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    
    console.log('\n3️⃣ Sending test email...');
    const testEmail = {
      from: `"VendorFlow Team" <${gmailUser}>`,
      to: 'test@example.com',
      subject: '🧪 Gmail SMTP Test',
      html: `
        <h2>🎉 Gmail SMTP Working!</h2>
        <p>This test email confirms that Gmail SMTP is configured correctly.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
      text: `Gmail SMTP Test - Success! Time: ${new Date().toISOString()}`
    };
    
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📧 From: ${result.envelope.from}`);
    console.log(`📨 To: ${result.envelope.to.join(', ')}`);
    
    console.log('\n🎉 Gmail SMTP is working correctly!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Gmail SMTP test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('   1. Gmail account credentials');
      console.error('   2. App Password is correct (not regular password)');
      console.error('   3. 2-Step Verification is enabled');
      console.error('   4. App Password is generated from Google Account settings');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection failed. Please check:');
      console.error('   1. Internet connection');
      console.error('   2. Firewall settings');
      console.error('   3. Gmail SMTP is accessible');
    }
    
    return false;
  }
}

// Run the test
testGmailSMTP()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 