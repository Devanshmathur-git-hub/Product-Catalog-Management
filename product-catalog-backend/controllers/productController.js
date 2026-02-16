const Product = require("../models/Product");


// 1. Get all products with filtering, sorting, searching & pagination

exports.getProducts = async (req, res) => {

  try {

    let query = {};

    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    // basic filters
    if (category) {
      query.category = category;
    }

    // price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // text search on name or description (case-insensitive)
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    // sorting
    let sortOption = {};

    if (sort === "price_asc") {
      sortOption.price = 1;
    }

    if (sort === "price_desc") {
      sortOption.price = -1;
    }

    if (sort === "name_asc") {
      sortOption.name = 1;
    }

    if (sort === "name_desc") {
      sortOption.name = -1;
    }

    if (sort === "stock_desc") {
      sortOption.stockCount = -1;
    }

    // default sort (newest first) when no explicit sort provided
    if (Object.keys(sortOption).length === 0) {
      sortOption.createdAt = -1;
    }

    // pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const totalItems = await Product.countDocuments(query);

    const products = await Product
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      items: products,
      totalItems,
      totalPages,
      page,
      limit,
    });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};



// 2. Get single product

exports.getProductById = async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};



// 3. Add product

exports.createProduct = async (req, res) => {

  try {

    const product = new Product(req.body);

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};



// 4. Update product

exports.updateProduct = async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(

      req.params.id,
      req.body,
      { new: true }

    );

    res.json(product);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};



// 5. Delete product

exports.deleteProduct = async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};
