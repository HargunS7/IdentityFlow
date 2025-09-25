import { loginService, signupService } from "../services/authService";

export async function handleLogin({ identifier, password }) {
  const payload = identifier.includes("@")
    ? { identifier: identifier.toLowerCase(), password }
    : { identifier, password };
  return await loginService(payload);
}

export async function handleSignup({ username, email, password }) {
  return await signupService({ username, email: email.toLowerCase(), password });
}

