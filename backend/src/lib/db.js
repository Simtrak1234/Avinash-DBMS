import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP DNS blocking MongoDB Atlas SRV (_mongodb._tcp) lookups & IPv6 precedence
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore if not permitted
}

try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  // Ignore
}

let isConnected = false;
let isConnecting = false;

const connectDB = async () => {
  if (isConnected || isConnecting) return;
  isConnecting = true;

  mongoose.set("strictQuery", true);

  const attemptConnect = async (attempt = 1) => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        dbName: "DataBase_Management",
        serverSelectionTimeoutMS: 5000,
      });

      isConnected = true;
      isConnecting = false;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}): ${error.message}`);
      console.log(`🔄 Retrying MongoDB connection in 5 seconds... (server stays running)`);
      setTimeout(() => attemptConnect(attempt + 1), 5000);
    }
  };

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    attemptConnect(1);
  });

  await attemptConnect();
};

export default connectDB;
