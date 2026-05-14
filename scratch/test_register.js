const axios = require('axios');

async function testRegister() {
  try {
    console.log('Sending registration request...');
    const res = await axios.post('https://bizerp-api.vercel.app/api/v1/auth/register', {
      businessName: 'Test Business',
      ownerName: 'Test Owner',
      businessType: 'Retail',
      mobile: '1234567890',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    console.log('SUCCESS!');
    console.log(res.data);
  } catch (err) {
    console.log('FAILED!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.log(err.message);
    }
  }
}

testRegister();
