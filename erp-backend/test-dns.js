const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const uri = 'mongodb+srv://monparamann2004_db_user:mann10101012@bizerp.rgclbgq.mongodb.net/?appName=BizERP';

async function testConnection() {
  console.log('Testing connection with Google DNS forced...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Successfully connected to MongoDB using forced DNS!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
