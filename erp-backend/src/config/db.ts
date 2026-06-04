import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging forever
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop the gstin_1 unique index to allow multiple FYs to share the same GSTIN
    try {
      await conn.connection.db?.collection('businesses').dropIndex('gstin_1');
      console.log('Dropped gstin_1 index successfully');
    } catch (e: any) {
      if (e.codeName !== 'IndexNotFound') {
        console.error('Failed to drop gstin_1 index:', e.message);
      }
    }
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // DO NOT process.exit(1) in serverless, let it throw so the API returns a 500
    throw error; 
  }
};

export default connectDB;
