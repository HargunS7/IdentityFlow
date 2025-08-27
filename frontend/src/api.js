import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // backend API
  withCredentials: true,
});

export default api;