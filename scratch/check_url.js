const axios = require('axios');

const urls = [
  'https://bizerp-india.vercel.app/api/health',
  'https://bizerp.vercel.app/api/health',
  'https://bizerp-backend.vercel.app/api/health',
  'https://bizerp-frontend.vercel.app/api/health'
];

async function check() {
  for (const url of urls) {
    try {
      console.log(`Checking ${url}...`);
      const res = await axios.get(url, { timeout: 5000 });
      console.log(`SUCCESS: ${url} -> ${res.status}`);
      console.log(res.data);
    } catch (e) {
      console.log(`FAILED: ${url} -> ${e.message}`);
    }
  }
}

check();
