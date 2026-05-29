const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Business = require('./src/models/Business.model').default;
    const businesses = await Business.find({});
    console.log(JSON.stringify(businesses, null, 2));
    mongoose.disconnect();
  });
