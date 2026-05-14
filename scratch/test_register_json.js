const axios = require('axios');

async function testRegister() {
  try {
    const res = await axios.post('https://bizerp-api.vercel.app/api/v1/auth/register', {
      businessName: 'Test Business',
      ownerName: 'Test Owner',
      businessType: 'Retail',
      mobile: '1234567890',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log('HTTP Status:', err.response.status);
      console.log('Response Body:', err.response.data);
    } else {
      console.log('Network Error:', err.message);
    }
  }
}

testRegister();
