import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api/v1' });

async function test() {
  try {
    const loginRes = await api.post('/auth/login', { email: 'admin@bizerp.com', password: 'password123' });
    const token = loginRes.data.token;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const payload = {
      purchaseType: 'GST',
      billNumber: 'BILL-1234',
      billDate: '2026-05-30',
      dueDate: '2026-05-30',
      placeOfSupply: 'Gujarat',
      supplierSnapshot: { name: 'Test Supplier' },
      isInterState: false,
      lineItems: [
        {
          productName: 'Test Product',
          quantity: 1,
          rate: 100,
          gstRate: 18,
          taxableAmount: 100,
          totalAmount: 118,
          unit: 'Nos'
        }
      ],
      amountPaid: 0,
      paymentMode: 'Cash',
      status: 'received'
    };

    const res = await api.post('/purchases', payload);
    console.log('SUCCESS:', res.data);
  } catch (err: any) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}
test();
