import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const fetchAllProducts = () => API.get("/products");
export const saveInvoice = (data) => API.post("/invoices", data);
export const fetchInvoices = () => API.get("/invoices");
export const fetchCustomers = () => API.get("/customers");
export const createCustomer = (data) => API.post("/customers", data);
