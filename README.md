## Product Catalog Management – Frontend Only

This is a **frontend-only UI** for a Product Catalog Management API. It assumes a REST API with a `Product` schema:

- **name**: string
- **description**: string
- **price**: number
- **category**: string
- **stockCount**: number

The UI supports:

- **List products** with advanced **filtering & sorting**
- **View product details**
- **Create, update, and delete** products

All backend calls are made to a configurable base URL.

### 1. Configure API base URL

Open `app.js` and edit:

```js
const API_BASE_URL = 'http://localhost:3000/products';
```

Point this to your API, e.g.:

- `http://localhost:3000/products`
- `https://your-domain.com/api/products`

The frontend expects endpoints:

- `GET /products` – list products, supports query params such as:
  - `?category=electronics&sort=price_asc`
  - Optionally: `search`, `minPrice`, `maxPrice`
- `GET /products/:id` – get a single product
- `POST /products` – create
- `PUT /products/:id` – update
- `DELETE /products/:id` – delete

### 2. Install dependencies

```bash
npm install
```

This only installs a lightweight static file server (`serve`) for local development.

### 3. Run the frontend

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

Make sure your backend API is running and reachable from the browser.

### 4. UI Overview

- **Filters & Sorting** (top panel):
  - Search by name/description
  - Filter by category
  - Min / max price
  - Sort by price, name, or stock
- **Products table**:
  - Click on a product name to see a quick details popup
  - Edit / Delete actions on each row
- **Product form**:
  - Add a new product
  - When you click **Edit**, the form switches to edit mode

