export function hasPerm(permissions, perm) {
  if (!permissions) return false;
  const list = permissions.combined || permissions;
  return list.includes(perm);
}

export function hasAnyPerm(permissions, perms = []) {
  if (!permissions) return false;
  const list = permissions.combined || permissions;
  return perms.some((p) => list.includes(p));
}
