import api from "../utils/api.js";

/**
 * Fetch authenticated user IAM profile from backend.
 * Includes:
 *  - user
 *  - roles
 *  - permissions { permanent, temporary, combined }
 *  - tempGrants
 */
export async function getMe() {
  const res = await api.get("/api/me");
  return res.data;
}
