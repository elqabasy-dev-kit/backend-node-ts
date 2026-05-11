/**
 * @file src/constants/permissions.ts
 * @description Permission constants for user roles and access control.
 * @author Mahros AL-Qabasy <mahros.dev>
 */


export enum Permission {
  // users
  USERS_READ = "users:read",
  USERS_WRITE = "users:write",
  USERS_DELETE = "users:delete",
  USERS_UPDATE = "users:update",


  SUPERUSER = "*",
}
