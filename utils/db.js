import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// export a function that connectes to db
export async function connectDb() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Db Connected");
  } catch (error) {
    console.error("❌ Error Connecting To MongoDb:", error.message);
    process.exit(1); // server band kar do agar db connect na ho
  }
}
