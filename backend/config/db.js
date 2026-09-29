const mongoose = require('mongoose');

let isConnectedToMongo = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartbin', {
      serverSelectionTimeoutMS: 2000 // Quick timeout if MongoDB is not running locally
    });
    isConnectedToMongo = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnectedToMongo = false;
    console.log(`[Database Note] Local MongoDB not detected (${error.message}). Using In-Memory Store for full functional preview.`);
  }
};

const isMongoActive = () => isConnectedToMongo;

module.exports = { connectDB, isMongoActive };
