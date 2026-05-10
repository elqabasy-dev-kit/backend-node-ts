/**
 * Granular Permissions for mahros.dev API
 */
export enum Permission {
  // User Management
  USERS_READ = "users:read",
  USERS_WRITE = "users:write",
  USERS_DELETE = "users:delete",

  // Global Superuser
  SUPERUSER = "*",
}
