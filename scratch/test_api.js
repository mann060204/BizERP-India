const https = require('https');

const urls = [
  'https://bizerp-api.vercel.app/api/health',
  'https://bizerp-backend.vercel.app/api/health',
  'https://biz-erp-india-api.vercel.app/api/health',
  'https://bizerp-india-api.vercel.app/api/health',
  'https://bizerp-india.vercel.app/api/health'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, status: res.statusCode, data }));
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function run() {
  for (const url of urls) {
    console.log(`Testing ${url}...`);
    const result = await checkUrl(url);
    if (result.status === 200 || result.status === 404) {
       console.log(`FOUND SERVER: ${url} (Status: ${result.status})`);
       console.log(`Data: ${result.data}`);
       if (result.status === 200) return;
    }
  }
}
run();
