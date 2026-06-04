import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("No MONGODB_URI found");
  process.exit(1);
}

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    if (!db) return;
    const users = await db.collection('users').find({}).toArray();
    console.log("Users:", users.map(u => ({ email: u.email, role: u.role, active: u.isActive })));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
