/*Example:

router.get("/", getProducts)
router.get("/:id", getProductById)
router.post("/", createProduct)
router.put("/:id", updateProduct)
router.delete("/:id", deleteProduct)


Meaning:

Request	Function called
GET /api/products	getProducts
GET /api/products/:id	getProductById
POST /api/products	createProduct
PUT /api/products/:id	updateProduct
DELETE /api/products/:id	deleteProduct*/




const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct

} = require("../controllers/productController");


// GET all products
router.get("/", getProducts);


// GET single product
router.get("/:id", getProductById);


// POST new product
router.post("/", createProduct);


// PUT update product
router.put("/:id", updateProduct);


// DELETE product
router.delete("/:id", deleteProduct);


module.exports = router;
