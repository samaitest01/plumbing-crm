# Plumbing CRM

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing plumbing business operations including invoices, customers, and products.

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control (ADMIN, PLUMBER, STAFF)
- **Invoice Management**: Create, view, and manage invoices with automatic invoice number generation
- **Customer Management**: Track customer information and invoice history
- **Product Catalog**: Pre-defined plumbing products with size variants and pricing
- **PDF Generation**: Generate professional PDF invoices
- **Reports & Analytics**: Sales trends, revenue by customer/product, payment status tracking
- **Record Keeping**: Mock payment tracking for bookkeeping (no actual payment processing)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/plumbing_crm
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
```

5. Start the backend server:
```bash
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000
```

5. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Authentication

1. On first run, navigate to `/login` to register a new user
2. Default roles available: ADMIN, PLUMBER, STAFF
3. ADMIN role has access to all features including reports
4. Login with your credentials to access the application

## 📦 Project Structure

```
plumbing-crm/
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── data/             # Product catalog data
│   ├── app.js            # Express app configuration
│   ├── server.js         # Server entry point
│   └── db.js             # Database connection
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── routes/       # Route protection
│   │   ├── services/     # API services
│   │   └── App.jsx       # Main app component
│   └── public/           # Static assets
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:mobile` - Get customer details with invoice history
- `POST /api/customers` - Create new customer

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:system` - Get products by system (CPVC/UPVC/SWR)

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id/pdf` - Download invoice as PDF

### Reports (Admin Only)
- `GET /api/reports/sales-trends?period=daily|weekly|monthly` - Get sales trends
- `GET /api/reports/revenue-by-customer` - Top customers by revenue
- `GET /api/reports/revenue-by-product` - Top products by revenue
- `GET /api/reports/payment-status` - Payment status summary
- `GET /api/reports/customer-metrics` - Customer metrics overview

## 🚀 Deployment

### Backend Deployment (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add all variables from `.env.example`
4. Deploy!

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy from the frontend directory:
```bash
cd frontend
vercel
```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your backend URL from Render

Or use the Vercel GitHub integration for automatic deployments.

## 🔒 Security Features

- JWT-based authentication with 7-day token expiry
- Password hashing using bcrypt
- Protected API routes with role-based access control
- CORS configuration for secure cross-origin requests
- Environment-based configuration
- Input validation on all forms

## 📝 Important Notes

- **Payment Processing**: This application includes MOCKED payment fields for record-keeping only. No actual payment processing is performed.
- **Database**: Ensure MongoDB is running before starting the backend
- **Environment Variables**: Never commit `.env` files to version control
- **Production**: Change `JWT_SECRET` to a strong random string in production
- **CORS**: Update `FRONTEND_URL` in backend `.env` to match your production frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, please open an issue in the GitHub repository.
