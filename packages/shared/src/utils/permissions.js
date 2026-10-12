import { ROLE_PERMISSIONS, USER_ROLES, WIFE_CONFIGURABLE_PERMISSIONS } from '../constants/index.js';

/**
 * Resolve effective permissions for a user.
 * Wife accounts may carry a configured subset via `allowedPermissions`.
 *
 * @param {{ role: string, allowedPermissions?: string[] | null }} user
 * @returns {string[]}
 */
export function resolvePermissions(user) {
  if (!user?.role) {
    return [];
  }

  const roleDefaults = ROLE_PERMISSIONS[user.role] ?? [];

  if (user.role === USER_ROLES.WIFE) {
    const configured = Array.isArray(user.allowedPermissions)
      ? user.allowedPermissions.filter((permission) =>
          WIFE_CONFIGURABLE_PERMISSIONS.includes(permission),
        )
      : [];

    if (configured.length > 0) {
      return [...new Set(configured)];
    }
  }

  return [...roleDefaults];
}

/**
 * @param {{ role: string, allowedPermissions?: string[] | null }} user
 * @param {string} permission
 */
export function hasPermission(user, permission) {
  return resolvePermissions(user).includes(permission);
}

/**
 * @param {{ role: string, allowedPermissions?: string[] | null }} user
 * @param {string[]} permissions
 * @param {'all' | 'any'} [mode]
 */
export function hasPermissions(user, permissions, mode = 'all') {
  const granted = new Set(resolvePermissions(user));

  if (mode === 'any') {
    return permissions.some((permission) => granted.has(permission));
  }

  return permissions.every((permission) => granted.has(permission));
}

/**
 * @param {{ role: string }} user
 * @param {...string} roles
 */
export function hasRole(user, ...roles) {
  if (!user?.role) {
    return false;
  }
  return roles.includes(user.role);
}
