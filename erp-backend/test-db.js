const mongoose = require('mongoose');

const uri = 'mongodb+srv://monparamann2004_db_user:mann10101012@bizerp.rgclbgq.mongodb.net/?appName=BizERP';

async function testConnection() {
  console.log('Testing connection...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
