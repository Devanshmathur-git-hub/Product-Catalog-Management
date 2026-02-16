require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("./config/db");

const seedFakeProducts = require("./faker/productFaker");


const runSeeder = async () => {

  try {

    // Step 3.1: Connect using your existing db.js
    await connectDB();


    // Step 3.2: Run faker function
    await seedFakeProducts(20);


    // Step 3.3: Disconnect after seeding
    await mongoose.disconnect();

    console.log("Seeding completed");

  }

  catch (error) {

    console.error(error);

  }

};


runSeeder();
