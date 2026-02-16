# Step-by-Step Working of Every Module

This document explains **how each module works** and **the exact order of steps** when something happens in the app.

---

# PART 1: BACKEND – When You Run `npm run dev`

## 1. Entry point: `server.js`

When you run `node server.js` (or `nodemon server.js`), this file runs **line by line**:

| Step | Code | What happens |
|------|------|----------------|
| 1 | `require("path")`, `require("express")`, etc. | Node loads the modules (path, express, cors, dotenv). |
| 2 | `require("./config/db")` | Loads the **db.js** function (does not run it yet). |
| 3 | `require("./routes/productRoutes")` | Loads **productRoutes.js**. That file in turn requires **productController.js**, which requires **models/Product.js**. So the whole chain is loaded. |
| 4 | `dotenv.config({ path: path.join(__dirname, ".env") })` | Reads `.env` and puts `PORT` and `MONGO_URI` into `process.env`. |
| 5 | `const app = express()` | Creates the Express application object. |
| 6 | `app.use(cors(...))` | Registers CORS middleware: every request will first go through this (allows browser from another port to call this API). |
| 7 | `app.use(express.json())` | Registers middleware that parses JSON request body into `req.body`. |
| 8 | `connectDB()` | **Calls** the database connection function (see **config/db.js** below). This runs now. |
| 9 | `app.use("/api/products", productRoutes)` | Says: “For any request whose path starts with `/api/products`, use the router from productRoutes.” So `/api/products` → router’s `/`, and `/api/products/123` → router’s `/:id`. |
| 10 | `app.get("/", ...)` | Registers the health check: GET `http://localhost:3001/` returns “Product Catalog API running”. |
| 11 | `app.listen(PORT, ...)` | Starts the HTTP server on `PORT` (e.g. 3001). The server is now **waiting for requests**. |

So the **order of execution** at startup is: load env → create app → add middleware → **connect DB** → mount routes → listen.

---

## 2. Module: `config/db.js`

This file **exports a single function** `connectDB`. It is **called** from `server.js` (step 8 above).

| Step | Code | What happens |
|------|------|----------------|
| 1 | `const uri = process.env.MONGO_URI` | Reads the MongoDB connection string from environment (set by dotenv from `.env`). |
| 2 | `if (!uri)` | If `MONGO_URI` is missing, logs an error and exits the process with `process.exit(1)`. |
| 3 | `await mongoose.connect(uri)` | Tells Mongoose to connect to MongoDB at that URI (e.g. `mongodb://127.0.0.1:27017/productcatalog`). This is **async**: the function waits until connected. |
| 4 | `console.log("MongoDB Connected")` | Runs only if connection succeeded. |
| 5 | `catch (error)` | If connection fails (e.g. MongoDB not running), it logs the error and exits with `process.exit(1)`. |

So **db.js** has one job: connect the Node process to MongoDB and exit if it can’t.

---

## 3. Module: `models/Product.js`

This file **defines the shape of a product** in MongoDB and **exports a Mongoose model**.

| Step | Code | What happens |
|------|------|----------------|
| 1 | `new mongoose.Schema({ ... })` | Defines the schema: which fields exist and their types. `required: true` means Mongoose will validate that the field is present when you save. |
| 2 | `createdAt: { type: Date, default: Date.now }` | When you don’t provide `createdAt`, Mongoose will set it to the current time. |
| 3 | `mongoose.model("Product", productSchema)` | Creates a **model** named `"Product"`. Mongoose will use the collection name `products` (lowercase, plural) in MongoDB. |
| 4 | `module.exports = ...` | So when the controller does `require("../models/Product")`, it gets this model. |

The model gives you methods like:

- `Product.find(query)` – find many documents
- `Product.findById(id)` – find one by `_id`
- `Product.findByIdAndUpdate(id, body, { new: true })` – update and return the new document
- `Product.findByIdAndDelete(id)` – delete one document
- `new Product(data)` then `doc.save()` – create a new document

So **Product.js** does not run a flow by itself; it just defines **what a product is** and **how to talk to the `products` collection**.

---

## 4. Module: `routes/productRoutes.js`

This file **maps HTTP method + path to controller functions**. It runs **when a request matches** `/api/products` or `/api/products/:id`.

| Step | Code | What happens |
|------|------|----------------|
| 1 | `const router = express.Router()` | Creates a mini-router that we will mount under `/api/products`. |
| 2 | `require("../controllers/productController")` | Loads the five controller functions: getProducts, getProductById, createProduct, updateProduct, deleteProduct. |
| 3 | `router.get("/", getProducts)` | When the request is **GET** and the path (after `/api/products`) is **/** → call `getProducts(req, res)`. So **GET /api/products** → getProducts. |
| 4 | `router.get("/:id", getProductById)` | **GET /api/products/123** → the part that matches `:id` is in `req.params.id` → call `getProductById(req, res)`. |
| 5 | `router.post("/", createProduct)` | **POST /api/products** → createProduct(req, res). |
| 6 | `router.put("/:id", updateProduct)` | **PUT /api/products/123** → updateProduct(req, res). |
| 7 | `router.delete("/:id", deleteProduct)` | **DELETE /api/products/123** → deleteProduct(req, res). |
| 8 | `module.exports = router` | server.js does `app.use("/api/products", productRoutes)`, so all these routes are under the base path `/api/products`. |

So **productRoutes.js** does not contain business logic; it only says **which URL + method** calls **which controller function**.

---

## 5. Module: `controllers/productController.js`

This is where **all product logic** lives. Each exported function receives `(req, res)` and uses the **Product** model to read/write the database, then sends a response.

### 5.1 – `getProducts` (GET all, with filter/sort)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `let query = {}` | Start with an empty query (meaning “match all documents”). |
| 2 | `if (req.query.category)` | If the URL was `?category=electronics`, then `req.query.category` is `"electronics"`. |
| 3 | `query.category = req.query.category` | So we only want products where `category` equals that value. |
| 4 | `let sortOption = {}` | By default no sorting. |
| 5 | `if (req.query.sort === "price_asc")` | If URL has `?sort=price_asc`, set `sortOption.price = 1` (ascending). |
| 6 | `if (req.query.sort === "price_desc")` | If `?sort=price_desc`, set `sortOption.price = -1` (descending). |
| 7 | `Product.find(query).sort(sortOption)` | Mongoose finds all documents matching `query`, sorts by `sortOption`, and returns a Promise of an array. |
| 8 | `res.json(products)` | Send that array as JSON with status 200. |
| 9 | `catch` | On any error (e.g. DB error), send status 500 and `{ message: error.message }`. |

So: **query params → build `query` and `sortOption` → find + sort → respond with JSON**.

### 5.2 – `getProductById` (GET one)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `Product.findById(req.params.id)` | `req.params.id` is the `:id` from the URL (e.g. `65f2c3a4b1e2f...`). Mongoose finds that document. |
| 2 | `if (!product)` | If no document found (wrong or deleted id), return `res.status(404).json({ message: "Product not found" })` and exit. |
| 3 | `res.json(product)` | Otherwise send the product as JSON. |

### 5.3 – `createProduct` (POST)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `new Product(req.body)` | `req.body` was parsed by `express.json()` and contains the JSON sent by the client (name, description, price, category, stockCount). Creates a new document in memory. |
| 2 | `product.save()` | Sends the document to MongoDB; MongoDB assigns `_id` and saves it. Returns the saved document. |
| 3 | `res.status(201).json(savedProduct)` | Respond with status 201 (Created) and the saved product (including `_id`). |

### 5.4 – `updateProduct` (PUT)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `Product.findByIdAndUpdate(req.params.id, req.body, { new: true })` | Finds the document by id, replaces its fields with `req.body`, and `{ new: true }` means “return the updated document” (not the old one). |
| 2 | `res.json(product)` | Send the updated product back. |

### 5.5 – `deleteProduct` (DELETE)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `Product.findByIdAndDelete(req.params.id)` | Removes the document with that id from MongoDB. |
| 2 | `res.json({ message: "Product deleted successfully" })` | Send a simple success message. |

---

# PART 2: FRONTEND – When You Open http://localhost:5173

## 6. What loads first: `index.html`

The browser requests the page. The server (e.g. `serve` or any static server) sends **index.html**. The browser parses it and:

| Step | What happens |
|------|----------------|
| 1 | Reads `<link rel="stylesheet" href="./styles.css" />` → sends a request for **styles.css** and applies the styles. |
| 2 | Builds the DOM: header, filters form, table (with empty tbody `#productsBody`), product form, etc. |
| 3 | Reaches `<script src="./app.js" type="module"></script>` → downloads and runs **app.js**. |

So the **order** is: HTML → load CSS → load and execute JS.

---

## 7. Module: `app.js` – Execution Order

When **app.js** runs, it does **not** wait for user clicks first. It runs from top to bottom; the last line calls `fetchProducts()`, so the list loads as soon as the script runs.

### 7.1 – When the script first runs (top to bottom)

| Step | Code | What happens |
|------|------|----------------|
| 1 | `const API_BASE_URL = 'http://localhost:3001/api/products'` | Saves the API base URL. Every fetch will use this (and add `?query` or `/:id` as needed). |
| 2 | `function buildQuery(params)` | Function defined; not run until someone calls it. It turns an object like `{ category: "electronics", sort: "price_asc" }` into a string `?category=electronics&sort=price_asc`. |
| 3 | `const productsBody = document.getElementById('productsBody')` | Gets the table body element (where product rows will go). Same for other elements (productsCount, listLoading, filtersForm, productForm, etc.). |
| 4 | `let isEditing = false` | Tracks whether the form is in “add” or “edit” mode. |
| 5 | All the `function` declarations | Defines fetchProducts, renderProducts, escapeHtml, handleSaveProduct, resetForm, startEditProduct, deleteProduct, viewProduct. None of these run yet. |
| 6 | `filtersForm.addEventListener('submit', ...)` | When the user submits the filter form, prevent default and call `fetchProducts()`. |
| 7 | `resetFiltersButton.addEventListener('click', ...)` | On “Reset”, clear the filter form and call `fetchProducts()`. |
| 8 | `productForm.addEventListener('submit', handleSaveProduct)` | On “Save Product” / “Update Product” click, run handleSaveProduct. |
| 9 | `cancelEditButton.addEventListener('click', resetForm)` | On “Cancel Edit”, run resetForm. |
| 10 | `productsBody.addEventListener('click', ...)` | **Single listener on the table body.** When any button inside is clicked, we check `data-action` and `data-id` and call viewProduct, startEditProduct, or deleteProduct. This is called **event delegation**. |
| 11 | `fetchProducts()` | **Called once at the end.** So as soon as the script loads, it fetches the product list and fills the table. |

So the **first thing the user sees** after load is: table filled (or “No products found” / error message) after `fetchProducts()` completes.

---

## 8. Step-by-step: What happens when the page loads

| Step | Where | What happens |
|------|--------|----------------|
| 1 | app.js | `fetchProducts()` is called (last line of script). |
| 2 | fetchProducts | Hides listError, shows listLoading. Reads the filter form (search, category, minPrice, maxPrice, sort) and builds a query string via `buildQuery()`. If the form is empty, the URL is just `http://localhost:3001/api/products` with no `?`. |
| 3 | fetchProducts | `fetch(API_BASE_URL + query)` sends **GET** to the backend. |
| 4 | Backend | Request hits Express → route GET `/api/products` → getProducts. Controller builds empty `query` and `sortOption` (because no query params), runs `Product.find({}).sort({})`, gets all products, sends JSON array. |
| 5 | fetchProducts | `res.json()` gives the array. Frontend does `renderProducts(data)`. |
| 6 | renderProducts | Clears `productsBody.innerHTML`. If array is empty, inserts one row “No products found…” and sets count to “0 items”. If not empty, for each product creates a `<tr>` with name (button with data-action="view", data-id=...), category, price, stock, and Edit/Delete buttons (data-action="edit"/"delete", data-id=...). Appends rows to the table. |
| 7 | fetchProducts | In `finally`, hides listLoading. So the user sees either the list or the empty state or an error message. |

---

## 9. Step-by-step: User clicks “Apply” on filters

| Step | Where | What happens |
|------|--------|----------------|
| 1 | Browser | User fills e.g. Category = “electronics”, Sort = “Price (Low → High)” and clicks Apply. |
| 2 | app.js | filtersForm’s submit listener runs. `event.preventDefault()` so the page does not reload. It calls `fetchProducts()`. |
| 3 | fetchProducts | Reads the form again: now category and sort have values. `buildQuery()` returns e.g. `?category=electronics&sort=price_asc`. |
| 4 | fetchProducts | `fetch('http://localhost:3001/api/products?category=electronics&sort=price_asc')`. |
| 5 | Backend | getProducts runs. `req.query.category` is “electronics”, `req.query.sort` is “price_asc”. So query = { category: "electronics" }, sortOption = { price: 1 }. Product.find(query).sort(sortOption) returns filtered and sorted list. |
| 6 | fetchProducts | Receives JSON, calls renderProducts(data). Table updates with only electronics, sorted by price low to high. |

---

## 10. Step-by-step: User adds a new product

| Step | Where | What happens |
|------|--------|----------------|
| 1 | User | Fills Name, Description, Price, Category, Stock Count and clicks “Save Product”. |
| 2 | app.js | productForm submit → handleSaveProduct(event). event.preventDefault() so no form submit. |
| 3 | handleSaveProduct | Reads form with FormData. Builds payload = { name, description, price, category, stockCount }. Validates name and category. isEditing is false, so url = API_BASE_URL, method = 'POST'. |
| 4 | handleSaveProduct | fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }). |
| 5 | Backend | POST /api/products → createProduct. new Product(req.body), then save(). MongoDB inserts the document and returns it with _id. res.status(201).json(savedProduct). |
| 6 | handleSaveProduct | Response is ok. Shows “Product created successfully.”, calls resetForm() (clears form, sets isEditing = false), then fetchProducts() to refresh the table. User sees the new product in the list. |

---

## 11. Step-by-step: User clicks “Edit” on a product

| Step | Where | What happens |
|------|--------|----------------|
| 1 | User | Clicks “Edit” on a row. The button has data-action="edit" and data-id="65f2c3a4b1e2f...". |
| 2 | app.js | productsBody click listener fires. target is the button. target.dataset.action is “edit”, target.dataset.id is the product id. So startEditProduct(id) is called. |
| 3 | startEditProduct | fetch(API_BASE_URL + '/' + id) → GET /api/products/65f2c3a4... |
| 4 | Backend | getProductById. Product.findById(req.params.id). Returns the product JSON. |
| 5 | startEditProduct | product = await res.json(). Fills the form: productId (hidden), name, description, price, category, stockCount. Sets isEditing = true, form title “Edit Product”, button “Update Product”, cancel button enabled. Scrolls to the form. |

So the form is now in **edit mode**. When the user clicks “Update Product”, handleSaveProduct runs again.

---

## 12. Step-by-step: User clicks “Update Product”

| Step | Where | What happens |
|------|--------|----------------|
| 1 | handleSaveProduct | isEditing is true. id is read from the hidden field. url = API_BASE_URL + '/' + id, method = 'PUT'. |
| 2 | handleSaveProduct | fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }). |
| 3 | Backend | PUT /api/products/:id → updateProduct. Product.findByIdAndUpdate(id, req.body, { new: true }). Returns updated document. |
| 4 | handleSaveProduct | On success: “Product updated successfully.”, resetForm(), fetchProducts(). Table refreshes with updated data. |

---

## 13. Step-by-step: User clicks “Delete”

| Step | Where | What happens |
|------|--------|----------------|
| 1 | User | Clicks “Delete”. Button has data-action="delete", data-id="...". |
| 2 | app.js | productsBody click listener → deleteProduct(id). |
| 3 | deleteProduct | window.confirm("Are you sure..."). If user cancels, function returns. |
| 4 | deleteProduct | fetch(API_BASE_URL + '/' + id, { method: 'DELETE' }). |
| 5 | Backend | DELETE /api/products/:id → deleteProduct. Product.findByIdAndDelete(id). Sends { message: "Product deleted successfully" }. |
| 6 | deleteProduct | On success, fetchProducts() runs. Table refreshes; that row is gone. |

---

## 14. Step-by-step: User clicks product name (View)

| Step | Where | What happens |
|------|--------|----------------|
| 1 | User | Clicks the product name (link-style button with data-action="view", data-id="..."). |
| 2 | app.js | productsBody click listener → viewProduct(id). |
| 3 | viewProduct | fetch(API_BASE_URL + '/' + id) → GET one product. |
| 4 | Backend | getProductById, returns product JSON. |
| 5 | viewProduct | product = await res.json(). Builds a string with name, description, category, price, stock, id and alert(details). |

---

# Summary: One request, full path

Example: **GET list with filter and sort**.

1. User: fills category “electronics”, sort “price_asc”, clicks Apply.
2. Frontend: submit listener → fetchProducts() → buildQuery() → GET `http://localhost:3001/api/products?category=electronics&sort=price_asc`.
3. Browser sends HTTP request to backend.
4. Express: CORS runs, express.json() not needed for GET → route matches GET /api/products → productRoutes → GET "/" → getProducts(req, res).
5. Controller: req.query = { category: "electronics", sort: "price_asc" } → query = { category: "electronics" }, sortOption = { price: 1 } → Product.find(query).sort(sortOption) → MongoDB returns documents → res.json(products).
6. Frontend: fetch gets response → res.json() → renderProducts(products) → table body cleared, new rows added for each product.
7. User sees the updated table.

Every other action (get one, create, update, delete) follows the same idea: **user action → event listener → fetch to the right URL with the right method → route → controller → model (MongoDB) → response → frontend updates UI.**
