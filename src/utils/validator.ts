import { ErrorCode, MyError } from "../types/error.type";

export const ensureObject = (body: unknown) => {
  if (!body || typeof body !== "object") {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid payload",
    });
  }

  return body as Record<string, unknown>;
};

export const readString = (
  body: Record<string, unknown>,
  key: string,
  options: {
    required?: boolean;
    trim?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {},
) => {
  const value = body[key];

  if (typeof value !== "string") {
    if (options.required === false && value === undefined) {
      return undefined;
    }

    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `${key} is required`,
    });
  }

  const normalized = options.trim === false ? value : value.trim();

  if (options.required !== false && normalized.length === 0) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `${key} is required`,
    });
  }

  if (options.minLength && normalized.length < options.minLength) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `${key} is too short`,
    });
  }

  if (options.maxLength && normalized.length > options.maxLength) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `${key} is too long`,
    });
  }

  return normalized;
};

export const validateEmail = (email: string) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Email is invalid",
    });
  }
};

export const validateUsername = (username: string) => {
  const usernamePattern = /^[a-zA-Z0-9._-]{3,50}$/;
  if (!usernamePattern.test(username)) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message:
        "Username must be 3-50 chars and use letters, numbers, dot, underscore, or dash",
    });
  }
};

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Password must be at least 8 characters long",
    });
  }
};
