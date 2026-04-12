import axios from "axios";

// Base URL points to backend; can be overridden per environment.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Shared axios instance for all API calls.
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

// Attach auth token automatically when user is logged in.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Centralized auth failure handling.
// On 401, clear local auth state and send user to login.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

// Product APIs
export const fetchAllProducts = () => API.get("/products");
export const createProduct = (data) => API.post("/products", data);
export const updateProduct = (system, productId, data) => API.put(`/products/${system}/${productId}`, data);
export const deleteProduct = (system, productId) => API.delete(`/products/${system}/${productId}`);
export const updateProductVariantStockQty = (system, productId, sizeMM, stockQty) =>
  API.patch(`/products/${system}/${productId}/variants/${sizeMM}/stock`, { stock_qty: stockQty });

// Invoice APIs
export const saveInvoice = (data) => API.post("/invoices", data);
export const fetchInvoices = () => API.get("/invoices");
export const updateInvoicePayment = (invoiceId, paymentData) => API.patch(`/invoices/${invoiceId}/payment`, paymentData);

// Customer APIs
export const fetchCustomers = () => API.get("/customers");
export const createCustomer = (data) => API.post("/customers", data);
export const fetchCustomerDetails = (mobile) => API.get(`/customers/${mobile}`);

// Reports & Analytics
export const fetchSalesTrends = (period = "daily") => 
  API.get(`/reports/sales-trends?period=${period}`);
export const fetchRevenueByCustomer = () => API.get("/reports/revenue-by-customer");
export const fetchRevenueByProduct = () => API.get("/reports/revenue-by-product");
export const fetchPaymentStatus = () => API.get("/reports/payment-status");
export const fetchCustomerMetrics = () => API.get("/reports/customer-metrics");
