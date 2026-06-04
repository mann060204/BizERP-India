const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const businesses = db.collection('businesses');
    
    try {
      await businesses.dropIndex('gstin_1');
      console.log('Dropped gstin_1 index successfully');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Index gstin_1 not found, nothing to drop.');
      } else {
        console.error('Error dropping index:', e);
      }
    }
  } catch (error) {
    console.error('Error connecting to db:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropIndex();
