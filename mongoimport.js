import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";

dotenv.config();

const importEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // ✅ read file from same folder
    const events = JSON.parse(await fs.promises.readFile("./seedfile.json", "utf-8"));
    console.log(`Found ${events.length} events to import`);

    const db = mongoose.connection.db;
    const collection = db.collection("events");

    await collection.insertMany(events);
    console.log("✅ Events imported successfully");

    process.exit();
  } catch (error) {
    console.error("Error connecting to MongoDB or seeding:", error);
    process.exit(1);
  }
};

importEvents();
