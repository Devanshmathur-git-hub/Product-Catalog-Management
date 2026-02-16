const { faker } = require("@faker-js/faker");
const Product = require("../models/Product");


// Step 3.1: Create function to generate one fake product
const generateFakeProduct = () => {

  return {

    name: faker.commerce.productName(),

    description: faker.commerce.productDescription(),

    price: Number(faker.commerce.price({ min: 100, max: 5000 })),

    category: faker.commerce.department(),

    stockCount: faker.number.int({ min: 0, max: 100 }),

    createdAt: faker.date.recent()

  };

};


// Step 3.2: Create function to insert many products
const seedFakeProducts = async (count = 10) => {

  try {

    const products = [];

    for (let i = 0; i < count; i++) {

      products.push(generateFakeProduct());

    }

    await Product.insertMany(products);

    console.log("Fake products inserted successfully");

  }

  catch (error) {

    console.error(error);

  }

};


module.exports = seedFakeProducts;
