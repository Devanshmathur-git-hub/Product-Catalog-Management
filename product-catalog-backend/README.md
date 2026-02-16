# Product Catalog Backend

Express + MongoDB API for the Product Catalog. Uses the industry-standard folder structure: `config`, `models`, `controllers`, `routes`.

## Setup

1. **MongoDB**  
   Ensure MongoDB is running locally (e.g. `mongod`), or set `MONGO_URI` in `.env` to your connection string.

2. **Environment**  
   Copy `.env.example` to `.env` and adjust if needed:
   - `PORT=5000`
   - `MONGO_URI=mongodb://127.0.0.1:27017/productcatalog`

3. **Install & run**
   ```bash
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:5000`. Use `npm start` for production.

## API Base URL

- **Base:** `http://localhost:5000/api/products`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | Get all products (supports `?category=...&sort=price_asc`) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Filtering & sorting

- `GET /api/products?category=electronics`
- `GET /api/products?sort=price_asc` or `sort=price_desc`
- `GET /api/products?category=electronics&sort=price_asc`

### Request body (POST/PUT)

```json
{
  "name": "iPhone 15",
  "description": "Latest Apple phone",
  "price": 80000,
  "category": "electronics",
  "stockCount": 50
}
```

## Frontend

Point the frontend’s `API_BASE_URL` in `app.js` to `http://localhost:5000/api/products` (already set when both projects are in the same repo).
