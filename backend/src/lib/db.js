import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP DNS blocking MongoDB Atlas SRV (_mongodb._tcp) lookups
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore if not permitted
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "DataBase_Management",
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
