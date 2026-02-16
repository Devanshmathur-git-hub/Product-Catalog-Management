# Product Catalog Management – Complete Project Explanation

Use this document to explain the project to your mentor or in an interview. It covers what the project does, how it is built, and how data flows end to end.

---

## 1. What Is This Project?

**Product Catalog Management** is a full-stack web application that lets you:

- **View** all products in a table
- **Add** new products
- **Edit** existing products
- **Delete** products
- **Filter** by category (and optionally by price range on the frontend)
- **Sort** by price (low→high, high→low), name, or stock

So it is a small **CRUD** (Create, Read, Update, Delete) app with **filtering and sorting** – the “advanced” part of the task.

---

## 2. High-Level Architecture (3 Layers)

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Browser)                                              │
│  • HTML + CSS + JavaScript (vanilla)                             │
│  • Runs at http://localhost:5173                                  │
│  • User sees: table of products, filters, add/edit form          │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP (fetch)
                            │  GET /api/products, POST, PUT, DELETE
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express)                                      │
│  • REST API                                                       │
│  • Runs at http://localhost:3001                                  │
│  • Routes: /api/products, /api/products/:id                       │
│  • Controllers: get products, get one, create, update, delete     │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Mongoose
                            │  connect(MONGO_URI)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE (MongoDB)                                               │
│  • Stores products (name, description, price, category, etc.)      │
│  • Runs at mongodb://127.0.0.1:27017/productcatalog                │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend**: talks to the backend using `fetch()` and the base URL `http://localhost:3001/api/products`.
- **Backend**: receives HTTP requests, uses **routes** → **controllers** → **models**, and reads/writes MongoDB.
- **Database**: MongoDB holds the actual product documents.

---

## 3. Tech Stack (and Why)

| Layer      | Technology   | Why |
|-----------|--------------|-----|
| Frontend  | HTML, CSS, JS (no framework) | Simple UI; good to show you understand DOM, forms, and fetch. |
| Backend   | Node.js + Express | Standard for REST APIs in Node; easy routing and middleware. |
| Database  | MongoDB      | NoSQL; flexible schema; Mongoose gives structure and validation. |
| DB driver | Mongoose     | Schema, validation, and easy API (find, findById, save, etc.). |
| Other     | dotenv, cors, nodemon | Env vars, cross-origin requests, auto-restart in dev. |

---

## 4. Backend Folder Structure (Industry Standard)

```
product-catalog-backend/
├── config/
│   └── db.js              ← Connects to MongoDB using MONGO_URI
├── models/
│   └── Product.js          ← Product schema (fields + types)
├── controllers/
│   └── productController.js ← Business logic (get, create, update, delete)
├── routes/
│   └── productRoutes.js   ← Maps URL + method → controller function
├── server.js              ← Entry point: Express app, middleware, routes, listen
├── .env                   ← PORT, MONGO_URI (not committed to git)
└── package.json
```

- **config/db.js**: Connects to MongoDB. If `MONGO_URI` is missing or connection fails, the app exits with a clear error.
- **models/Product.js**: Defines what a “product” looks like in the database.
- **controllers/productController.js**: Implements the five operations and sends JSON responses.
- **routes/productRoutes.js**: Defines which HTTP method and path call which controller.
- **server.js**: Creates the Express app, uses CORS and `express.json()`, connects DB, mounts `/api/products`, and starts the server.

---

## 5. Data Model: Product Schema

Every product in MongoDB has this shape (defined in `models/Product.js`):

| Field       | Type   | Required | Description |
|------------|--------|----------|-------------|
| name       | String | Yes      | Product name |
| description| String | Yes      | Short description |
| price      | Number | Yes      | Price (e.g. 99.99) |
| category   | String | Yes      | e.g. "electronics" |
| stockCount | Number | Yes      | How many in stock |
| createdAt  | Date   | No (auto) | Set by default to Date.now |
| _id        | ObjectId | Auto   | Unique ID (MongoDB adds this) |

In the frontend and API we often use `id`; that comes from MongoDB’s `_id` (Mongoose exposes it as `id` in JSON).

---

## 6. API Endpoints (All 5)

Base URL: **http://localhost:3001/api/products**

| # | Method | Path           | Purpose | Example |
|---|--------|----------------|---------|---------|
| 1 | GET    | /api/products  | Get all products (with optional filter/sort) | `GET /api/products?category=electronics&sort=price_asc` |
| 2 | GET    | /api/products/:id | Get one product by ID | `GET /api/products/65f2c3a4b1e2f...` |
| 3 | POST   | /api/products  | Create a new product | Body: JSON with name, description, price, category, stockCount |
| 4 | PUT    | /api/products/:id | Update a product | Body: JSON with fields to update |
| 5 | DELETE | /api/products/:id | Delete a product | No body |

**Example – Create product (POST):**

```json
POST /api/products
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Latest Apple phone",
  "price": 80000,
  "category": "electronics",
  "stockCount": 50
}
```

Response: `201` with the saved product (including `_id`).

**Example – Get one product (GET by ID):**

```
GET /api/products/65f2c3a4b1e2f...
```

Response: `200` with one product, or `404` with `{ "message": "Product not found" }`.

---

## 7. Advanced Part: Filtering and Sorting

This is what makes the project “advanced”: the **list** endpoint supports query parameters.

### Filtering

- **By category**:  
  `GET /api/products?category=electronics`  
  Backend builds a query: `{ category: "electronics" }` and uses `Product.find(query)`.

(On the frontend we also have min/max price and search fields; the backend currently implements only **category** filter. Adding `minPrice`/`maxPrice` in the controller would use `query.price = { $gte: min, $lte: max }`.)

### Sorting

- **Price ascending**: `GET /api/products?sort=price_asc`  
  Backend: `sortOption = { price: 1 }` → `.sort(sortOption)`.
- **Price descending**: `GET /api/products?sort=price_desc`  
  Backend: `sortOption = { price: -1 }`.

So “filter + sort” is:  
`GET /api/products?category=electronics&sort=price_asc`

Controller logic in short:

1. Start with empty `query` and `sortOption`.
2. If `req.query.category` exists → `query.category = req.query.category`.
3. If `req.query.sort === "price_asc"` → `sortOption.price = 1`; if `"price_desc"` → `sortOption.price = -1`.
4. `Product.find(query).sort(sortOption)` → send result as JSON.

---

## 8. Request/Response Flow (Step by Step)

### Get all products (with optional filter/sort)

1. User clicks “Apply” on filters (or page loads).
2. Frontend reads filter form (category, sort, etc.), builds query string, e.g. `?category=electronics&sort=price_asc`.
3. Frontend: `fetch('http://localhost:3001/api/products?category=electronics&sort=price_asc')`.
4. Backend: route `GET /` → `getProducts` controller.
5. Controller: reads `req.query`, builds `query` and `sortOption`, runs `Product.find(query).sort(sortOption)`.
6. Backend sends JSON array of products.
7. Frontend: `res.json()` → parse JSON → `renderProducts(data)` → fills the table.

### Get one product (for View / Edit)

1. User clicks product name (View) or “Edit”.
2. Frontend: `fetch('http://localhost:3001/api/products/' + id)`.
3. Backend: route `GET /:id` → `getProductById`.
4. Controller: `Product.findById(req.params.id)` → if not found, `404`; else send product JSON.
5. Frontend: for View → show in alert/modal; for Edit → fill form and set “edit mode”.

### Create product

1. User fills “Add Product” form and submits.
2. Frontend: `fetch(API_BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, price, category, stockCount }) })`.
3. Backend: route `POST /` → `createProduct`.
4. Controller: `new Product(req.body)` → `product.save()` → send `201` and saved product.
5. Frontend: on success, clear form, call `fetchProducts()` again to refresh the table.

### Update product

1. User edits form and clicks “Update Product”.
2. Frontend: `fetch(API_BASE_URL + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, price, category, stockCount }) })`.
3. Backend: route `PUT /:id` → `updateProduct`.
4. Controller: `Product.findByIdAndUpdate(id, req.body, { new: true })` → send updated product.
5. Frontend: on success, exit edit mode, refresh list.

### Delete product

1. User clicks “Delete” → confirm.
2. Frontend: `fetch(API_BASE_URL + '/' + id, { method: 'DELETE' })`.
3. Backend: route `DELETE /:id` → `deleteProduct`.
4. Controller: `Product.findByIdAndDelete(id)` → send `{ message: "Product deleted successfully" }`.
5. Frontend: call `fetchProducts()` to refresh the table.

---

## 9. Frontend Structure (No Framework)

- **index.html**: Structure – header, filters form, products table, add/edit product form. No logic.
- **styles.css**: Layout and styling (grid, table, buttons, panels).
- **app.js**: All logic:
  - `API_BASE_URL = 'http://localhost:3001/api/products'`
  - `fetchProducts()`: GET list (with query from filters), then `renderProducts()`
  - `renderProducts(products)`: Clears table, loops products, creates rows with View / Edit / Delete buttons; uses `data-action` and `data-id` for event handling
  - `handleSaveProduct()`: If edit mode → PUT; else POST; then refresh list
  - `startEditProduct(id)`: GET one product, fill form, set edit mode
  - `deleteProduct(id)`: Confirm → DELETE → refresh list
  - `viewProduct(id)`: GET one product, show details (e.g. alert)
  - Event listeners: filter form submit, reset filters, product form submit, cancel edit, and **delegated** click on table (view/edit/delete by `data-action` and `data-id`)
  - `escapeHtml()`: Prevents XSS when putting product name/description in the table

So: one HTML page, one CSS file, one JS file; all API calls go to the same base URL with different methods and paths.

---

## 10. Environment and Running the Project

- **.env** (backend, not in git):  
  `PORT=3001`  
  `MONGO_URI=mongodb://127.0.0.1:27017/productcatalog`

- **Run order:**
  1. Start MongoDB (e.g. `mongod` or `brew services start mongodb-community`).
  2. Backend: `cd product-catalog-backend` → `npm run dev` (port 3001).
  3. Frontend: from project root → `npm run dev` (e.g. port 5173).
  4. Open http://localhost:5173 and use the app; backend is at http://localhost:3001.

---

## 11. Important Concepts to Mention to Your Mentor

1. **REST API**: Resources (products) exposed as URLs; GET (read), POST (create), PUT (update), DELETE (delete).
2. **Separation of concerns**: Routes → Controllers → Models; frontend only does UI and HTTP calls.
3. **CRUD**: Create (POST), Read (GET one + GET all), Update (PUT), Delete (DELETE).
4. **Query parameters**: Used for filtering and sorting on GET (e.g. `?category=electronics&sort=price_asc`).
5. **Mongoose**: Schema (structure + validation), then methods like `find`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete`, `save`.
6. **CORS**: Backend allows requests from another origin (e.g. localhost:5173) so the browser allows `fetch` from the frontend to the API.
7. **Environment variables**: Port and database URL in `.env` so we don’t hardcode them and can change per environment.

---

## 12. Possible Mentor / Interview Questions and Short Answers

**Q: What is this project?**  
A: A full-stack Product Catalog: CRUD for products plus filtering by category and sorting by price (and similar). Frontend in vanilla JS, backend in Node/Express, database in MongoDB.

**Q: How many API endpoints and what do they do?**  
A: Five. GET all (with optional filter/sort), GET one by ID, POST create, PUT update by ID, DELETE by ID.

**Q: Where is the product schema defined?**  
A: In the backend, in `models/Product.js`, using Mongoose: name, description, price, category, stockCount (all required), and createdAt (default Date.now). MongoDB adds _id.

**Q: How does filtering/sorting work?**  
A: The “get all” endpoint reads `req.query` (e.g. `category`, `sort`). It builds a MongoDB query object and a sort object (e.g. `{ price: 1 }` for ascending), then uses `Product.find(query).sort(sortOption)` and returns the result as JSON.

**Q: Why do we use CORS?**  
A: The frontend (e.g. localhost:5173) and the API (localhost:3001) are different origins. Browsers block cross-origin requests unless the server sends the right CORS headers. We use the `cors()` middleware so the API allows requests from the frontend.

**Q: What is the role of routes vs controllers?**  
A: Routes map HTTP method + path to a function (e.g. `GET /` → `getProducts`). Controllers contain the logic: read request, talk to the model (Product), send response. So routes = “which function”; controllers = “what that function does”.

**Q: How does the frontend know the backend URL?**  
A: It’s set in `app.js` as `API_BASE_URL = 'http://localhost:3001/api/products'`. All fetch calls use this base for the list and append `/${id}` or query string as needed.

**Q: What happens when we click “Edit” on a product?**  
A: Frontend sends GET `/api/products/:id`, gets the product, fills the form with its data, and switches to “edit mode”. On “Update Product” it sends PUT `/api/products/:id` with the form data, then refreshes the list.

---

You can share this document with your brother and use it as a script for explaining the project to your mentor. Good luck.
