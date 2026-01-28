# API Documentation - Plumbing CRM

Base URL: `http://localhost:5000/api` (development)

All protected endpoints require authentication token in the header:
```
Authorization: Bearer <token>
```

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STAFF" // Options: "ADMIN", "PLUMBER", "STAFF"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

### Login
**POST** `/auth/login`

Authenticate and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

## Customers

### Get All Customers
**GET** `/customers`

Retrieve all customers.

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "Jane Smith",
    "mobile": "9876543210",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Create Customer
**POST** `/customers`

Create a new customer.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "mobile": "9876543210"
}
```

**Validation:**
- Name: Required, alphabetic characters
- Mobile: Required, exactly 10 digits

**Response (201):**
```json
{
  "_id": "60d5ec49f1b2c72b8c8e4f1a",
  "name": "Jane Smith",
  "mobile": "9876543210",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Get Customer Details
**GET** `/customers/:mobile`

Get customer with invoice history and statistics.

**Response (200):**
```json
{
  "customer": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "Jane Smith",
    "mobile": "9876543210"
  },
  "invoices": [...],
  "stats": {
    "totalInvoices": 5,
    "totalBilled": "15000.00",
    "totalRecorded": "10000.00",
    "totalPending": "5000.00"
  }
}
```

## Products

### Get All Products
**GET** `/products`

Get all products organized by system.

**Response (200):**
```json
[
  {
    "system": "CPVC",
    "category": "Chlorinated Polyvinyl Chloride",
    "products": [
      {
        "id": "cpvc_pipe_sdr11",
        "name": "CPVC Pipe SDR-11",
        "unit": "length",
        "length_m": 3,
        "variants": [
          {
            "size_mm": 15,
            "price": 150.50
          }
        ]
      }
    ]
  }
]
```

### Get Products by System
**GET** `/products/:system`

Get products for a specific system (CPVC, UPVC, SWR).

**Response (200):**
```json
{
  "system": "CPVC",
  "category": "Chlorinated Polyvinyl Chloride",
  "products": [...]
}
```

## Invoices

### Get All Invoices
**GET** `/invoices`

Retrieve all invoices with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response (200):**
```json
{
  "invoices": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "invoiceNumber": "AB12345",
      "customerName": "Jane Smith",
      "customerMobile": "9876543210",
      "items": [
        {
          "productName": "CPVC Pipe SDR-11",
          "sizeMM": 15,
          "qty": 10,
          "price": 150.50,
          "discount": 5,
          "baseAmount": 1505.00,
          "amount": 1429.75
        }
      ],
      "subTotal": 1505.00,
      "total": 1429.75,
      "paymentStatus": "Pending",
      "paymentMode": "Cash",
      "amountRecorded": 0,
      "balanceAmount": 1429.75,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalInvoices": 250,
    "hasMore": true
  }
}
```

### Create Invoice
**POST** `/invoices`

Create a new invoice.

**Request Body:**
```json
{
  "customerName": "Jane Smith",
  "customerMobile": "9876543210",
  "items": [
    {
      "productName": "CPVC Pipe SDR-11",
      "sizeMM": 15,
      "qty": 10,
      "price": 150.50,
      "discount": 5,
      "baseAmount": 1505.00,
      "amount": 1429.75
    }
  ],
  "subTotal": 1505.00,
  "total": 1429.75,
  "paymentStatus": "Pending",
  "paymentMode": "Cash",
  "amountRecorded": 0,
  "balanceAmount": 1429.75
}
```

**Validation:**
- customerName: Required
- customerMobile: Required
- items: Required, at least one item
- subTotal: Required
- total: Required

**Response (201):**
```json
{
  "_id": "60d5ec49f1b2c72b8c8e4f1a",
  "invoiceNumber": "AB12345",
  ...
}
```

### Download Invoice PDF
**GET** `/invoices/:id/pdf`

Download invoice as PDF.

**Response:** PDF file stream

## Reports (Admin Only)

All report endpoints require authentication with ADMIN role.

### Get Sales Trends
**GET** `/reports/sales-trends?period=daily`

Get sales trends over time.

**Query Parameters:**
- `period`: `daily`, `weekly`, or `monthly`

**Response (200):**
```json
[
  {
    "date": "2024-01-15",
    "amount": 15000.50
  }
]
```

### Get Revenue by Customer
**GET** `/reports/revenue-by-customer`

Get top 10 customers by revenue.

**Response (200):**
```json
[
  {
    "name": "Jane Smith",
    "revenue": 50000.00
  }
]
```

### Get Revenue by Product
**GET** `/reports/revenue-by-product`

Get top 10 products by revenue.

**Response (200):**
```json
[
  {
    "name": "CPVC Pipe SDR-11 (15mm)",
    "revenue": 25000.00
  }
]
```

### Get Payment Status
**GET** `/reports/payment-status`

Get payment status summary.

**Response (200):**
```json
{
  "totalInvoices": 250,
  "recordedCount": 150,
  "pendingCount": 100,
  "recordedAmount": 500000.00,
  "pendingAmount": 150000.00,
  "note": "Mock payment tracking - no actual payment processing"
}
```

### Get Customer Metrics
**GET** `/reports/customer-metrics`

Get comprehensive customer metrics.

**Response (200):**
```json
{
  "totalCustomers": 50,
  "totalInvoices": 250,
  "totalRevenue": 650000.00,
  "averageOrderValue": 2600.00,
  "topCustomers": [
    {
      "name": "Jane Smith",
      "invoices": 15,
      "revenue": 50000.00
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "message": "Validation error message",
  "error": "Detailed error information"
}
```

**401 Unauthorized:**
```json
{
  "message": "Not authorized, no token provided"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied - insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error message",
  "error": "Detailed error information (development only)"
}
```

## Payment Fields (MOCKED)

**Important:** All payment-related fields in this API are for record-keeping purposes only. No actual payment processing is performed.

- `paymentStatus`: "Recorded" or "Pending"
- `paymentMode`: "Cash", "UPI", "Card", "Other"
- `amountRecorded`: Amount recorded in books
- `balanceAmount`: Remaining balance for records

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing rate limiting to prevent abuse.

## CORS

The API accepts requests from the configured `FRONTEND_URL` environment variable. In development, this is typically `http://localhost:5173`.

## Authentication Token

- Tokens expire after 7 days
- Store the token securely (localStorage/sessionStorage)
- Include in all protected requests as: `Authorization: Bearer <token>`
- Token is automatically refreshed on login/register

## Best Practices

1. Always validate user input on the frontend before sending to API
2. Handle authentication errors by redirecting to login
3. Implement proper error handling for all API calls
4. Use loading states while waiting for API responses
5. Cache frequently accessed data (products, customers) when appropriate
6. Implement retry logic for failed requests
7. Use pagination for large datasets
