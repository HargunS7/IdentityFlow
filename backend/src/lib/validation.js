// Password policy and input validation helpers

// Password policy:
// - length 12-128
// - at least 1 lowercase, 1 uppercase, 1 digit, 1 special
// - no leading/trailing spaces, no 3+ identical in a row
// - reject if contains email local-part or username (caller must pass context)

export function validateEmailFormat(email) {
  if (typeof email !== "string") return { valid: false, reason: "Invalid type" };
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: "Invalid email format" };
  }
  return { valid: true };
}

export function validateUsernameFormat(username) {
  if (typeof username !== "string") return { valid: false, reason: "Invalid type" };
  const trimmed = username.trim();
  // 3-32 chars, letters, numbers, underscore, hyphen, dot; must start with letter
  if (!/^[A-Za-z][A-Za-z0-9._-]{2,31}$/.test(trimmed)) {
    return { valid: false, reason: "Invalid username format" };
  }
  return { valid: true };
}

export function validatePasswordStrength(password, context = {}) {
  if (typeof password !== "string") return { valid: false, reason: "Invalid type" };
  if (password !== password.trim()) {
    return { valid: false, reason: "Password must not start or end with spaces" };
  }

  const length = password.length;
  if (length < 12 || length > 128) {
    return { valid: false, reason: "Password must be 12-128 characters long" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Add at least one lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Add at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Add at least one number" };
  }
  if (!/[~!@#$%^&*()_+\-={}\[\]|;:"'`,.<>/?]/.test(password)) {
    return { valid: false, reason: "Add at least one special character" };
  }
  if (/(.)\1\1/.test(password)) {
    return { valid: false, reason: "Avoid repeating a character 3+ times" };
  }

  const { email, username } = context;
  if (email && typeof email === "string") {
    const local = email.split("@")[0];
    if (local && local.length >= 3 && password.toLowerCase().includes(local.toLowerCase())) {
      return { valid: false, reason: "Password must not contain your email" };
    }
  }
  if (username && typeof username === "string" && username.length >= 3) {
    if (password.toLowerCase().includes(username.toLowerCase())) {
      return { valid: false, reason: "Password must not contain your username" };
    }
  }

  return { valid: true };
}

