async function testRegister() {
  try {
    const res = await fetch('https://bizerp-api.vercel.app/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Business',
        ownerName: 'Test Owner',
        businessType: 'Retail',
        mobile: '1234567890',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123'
      })
    });
    
    const data = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', data);
  } catch (err) {
    console.log('Network Error:', err.message);
  }
}

testRegister();
