// Deprecated. Use `auth()` from ./auth.js instead.
// Kept only so any external imports don't break during migration.
import { auth } from "./auth.js";

export const requireAuth = auth(true);
