# AI Coding Agent Instructions for Plumbing CRM

## Project Overview

**Plumbing CRM** is a full-stack MERN application for managing invoices, customers, and products. The architecture separates frontend (React + Vite) and backend (Node.js/Express + MongoDB).

- **Backend**: Express server on port 5000, RESTful APIs
- **Frontend**: React + Vite with React Router, Axios for HTTP calls
- **Database**: MongoDB (local instance at `mongodb://127.0.0.1:27017/plumbing_crm`)

## Architecture & Data Flows

### Core Features
1. **Billing/Invoice Creation** (`/billing` route): Generate invoices with line items, calculate totals with discounts
2. **Invoice Listing** (`/invoices` route): View all saved invoices
3. **Customer Management** (`/customers` route): Track customer names and mobile numbers
4. **Product Catalog**: Pre-defined plumbing products with size variants

### Key Integration Points
- **Frontend → Backend**: Axios calls to `http://localhost:5000/api/*` (see [frontend/src/services/api.js](frontend/src/services/api.js))
- **Authentication**: JWT tokens (7-day expiry), stored in browser—backend expects `JWT_SECRET` env var
- **Data Models**: Customers have unique mobile numbers; Invoices embed customer info + line items (no custom ID field, uses MongoDB `_id`)

## Critical Developer Workflows

### Running the Application
```bash
# Backend
cd backend
npm install
npm run dev  # or npm start, both run: node server.js (port 5000)

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # Vite dev server, typically http://localhost:5173
```

### Database Setup
- MongoDB must be running locally (no Docker or cloud setup)
- No migrations or seeding script—models defined inline in [backend/models/](backend/models/)

### Linting
- Frontend: `npm run lint` (ESLint configured in [frontend/eslint.config.js](frontend/eslint.config.js))
- Backend: No linter configured

## Project-Specific Patterns & Conventions

### Backend Routing & Structure
```javascript
// Routes are mounted on /api/* prefix (app.js)
app.use("/api/customers", require("./routes/customers.routes"));
app.use("/api/products", require("./routes/products.routes"));
app.use("/api/invoices", require("./routes/invoices.routes"));

// Each route file exports a router; controllers import models and JWT logic
```

### Frontend Authentication Flow
- User state stored in [AuthContext.jsx](frontend/src/context/AuthContext.jsx) (localStorage backup)
- Auth controller generates JWT on register/login; frontend stores token but **doesn't automatically send it with API calls**
- If implementing API token auth: add `Authorization: Bearer <token>` header in Axios interceptor (not yet implemented)

### Invoice Line Items
```javascript
// Each item in Invoice.items array has:
{ productName, sizeMM, qty, price, discount, baseAmount, amount }
// Calculation pattern: amount = (baseAmount - discount) after qty × price
```

### Frontend Routes
```jsx
// App.jsx routes:
"/" → "/billing" (CreateInvoice component)
"/invoices" → Invoices list view
"/customers" → Customers management
// ProtectedRoute.jsx exists but not actively used—implement if adding role-based access
```

## Important Caveats

1. **Invoice ID**: Uses MongoDB `_id` (auto-generated)—don't add custom ID field
2. **CORS enabled**: Backend allows all origins (see app.js)
3. **Module syntax mismatch**: Backend uses CommonJS (`require`), auth controller uses ES6 imports—maintain this pattern per file
4. **No password hashing configured**: `comparePassword` method called in auth.controller but not implemented in User model
5. **Mobile uniqueness**: Customer schema enforces unique mobile numbers—handle duplicate errors in API calls

## File Reference Map

| Component | Files |
|-----------|-------|
| **Backend Setup** | [backend/server.js](backend/server.js), [backend/app.js](backend/app.js), [backend/db.js](backend/db.js) |
| **Data Models** | [backend/models/](backend/models/) (Customer, Invoice, User) |
| **Auth Logic** | [backend/controllers/auth.controller.js](backend/controllers/auth.controller.js), [backend/routes/auth.routes.js](backend/routes/auth.routes.js) |
| **API Calls** | [frontend/src/services/api.js](frontend/src/services/api.js) |
| **Auth Context** | [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) |
| **Page Routes** | [frontend/src/App.jsx](frontend/src/App.jsx) |

## When Adding Features

- **New API endpoint**: Create route file in `backend/routes/`, mount in `app.js`, add axios call in `frontend/src/services/api.js`
- **New page**: Add `.jsx` in `frontend/src/pages/`, import in `App.jsx`, use Axios for data fetching
- **New model**: Define schema in `backend/models/`, import in routes/controllers
- **Authentication checks**: Implement token validation middleware in `backend/routes/auth.middleware.js` (middleware exists but not enforced on routes)
