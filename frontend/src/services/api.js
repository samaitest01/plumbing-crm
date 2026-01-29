import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle response errors
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
