import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const fetchAllProducts = () => API.get("/products");
export const saveInvoice = (data) => API.post("/invoices", data);
export const fetchInvoices = () => API.get("/invoices");
export const fetchCustomers = () => API.get("/customers");
export const createCustomer = (data) => API.post("/customers", data);

// Reports & Analytics
export const fetchSalesTrends = (period = "daily") => 
  API.get(`/reports/sales-trends?period=${period}`);
export const fetchRevenueByCustomer = () => API.get("/reports/revenue-by-customer");
export const fetchRevenueByProduct = () => API.get("/reports/revenue-by-product");
export const fetchPaymentStatus = () => API.get("/reports/payment-status");
export const fetchCustomerMetrics = () => API.get("/reports/customer-metrics");
