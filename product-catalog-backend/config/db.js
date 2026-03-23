const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Add it to your .env file (see .env.example).");
    process.exit(1);
  }
  try {

    await mongoose.connect(uri);

    console.log("MongoDB Connected");

  } catch (error) {

    console.error("MongoDB connection failed:", error.message);
    console.error("→ Is MongoDB installed and running? Start it with: mongod");
    console.error("→ Or use MongoDB Atlas and set MONGO_URI in .env");
    process.exit(1);

  }
};

module.exports = connectDB;


