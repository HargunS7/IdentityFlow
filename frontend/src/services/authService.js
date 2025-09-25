import api from "../api";

export async function loginService(payload) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

export async function signupService(payload) {
  const res = await api.post("/api/auth/signup", payload);
  return res.data;
}

