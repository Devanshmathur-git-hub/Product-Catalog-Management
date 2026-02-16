const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");

// Load .env from backend folder (works even if you run from project root)
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// middleware – allow frontend (e.g. localhost:5173) to call this API
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// database connection
connectDB();

// routes
app.use("/api/products", productRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Product Catalog API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
