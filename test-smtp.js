const nodemailer = require('nodemailer');

// SMTP credentials from phlauncher.com (with fixed algorithm)
const smtpConfig = {
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'AKIA3QWLAO4EMMSI5EHU',
    pass: 'BE2RDP3rygDIP3nbYr1pNiDBNWdh2WktcxdEUxjq/IEB'
  }
};

async function sendTestEmail() {
  console.log('Creating SMTP transport...');
  const transporter = nodemailer.createTransport(smtpConfig);

  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('✅ SMTP connection verified successfully!');

  console.log('Sending test email...');
  const info = await transporter.sendMail({
    from: 'noreply@phlauncher.com',
    to: 'eibrahim@gmail.com',
    subject: 'FreeResend SMTP Test - phlauncher.com',
    text: 'This is a test email sent via SMTP using the generated credentials from FreeResend!',
    html: `
      <h2>✅ SMTP Test Successful!</h2>
      <p>This email was sent via SMTP using:</p>
      <ul>
        <li><strong>Domain:</strong> phlauncher.com</li>
        <li><strong>Server:</strong> email-smtp.us-east-1.amazonaws.com:587</li>
        <li><strong>Username:</strong> AKIA3QWLAO4EFHIQWNN6</li>
      </ul>
      <p>Your SMTP credentials are working correctly!</p>
      <hr>
      <p><small>Sent from FreeResend - Self-hosted email service</small></p>
    `
  });

  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
}

sendTestEmail()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  });
