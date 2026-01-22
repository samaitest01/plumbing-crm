import axios from "axios";

export const loginUser = (data) =>
  axios.post("/api/auth/login", data);

export const registerUser = (data) =>
  axios.post("/api/auth/register", data);
