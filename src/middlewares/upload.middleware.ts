/**
 * @file middlewares/upload.middleware.ts
 * @description Middleware to handle file uploads for avatars and ticket attachments. It validates file types and sizes, and provides error handling for upload issues.
 *              Avatar uploads are limited to 5MB and must be JPEG, PNG, or WEBP.
 *              Ticket attachments are limited to 10MB each, with a maximum of 5 files per request, and must be JPEG, PNG, WEBP, or PDF.
 *              This is for s3 storage, but in the future we will use an adapter, so we can easily switch to local storage if needed. or any other object storage services.
 */

import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ErrorCode, MyError } from "../types/error.type";
import { HttpStatus } from "../constants/httpStatus";
import { MyResponse } from "../types/response.type";

const MAX_AVATAR_SIZE_MB = 5;
const MAX_TICKET_ATTACHMENT_SIZE_MB = 10;

/**
 * Valid Image MimeTypes
 */
const allowedAvatarMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedTicketAttachmentMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Configure Multer Memory Storage
 * We use memory storage because we will upload to S3/Local later in the service
 */
const storage = multer.memoryStorage();

const maxAvatarSizeBytes = MAX_AVATAR_SIZE_MB * 1024 * 1024;
const maxTicketAttachmentSizeBytes = MAX_TICKET_ATTACHMENT_SIZE_MB * 1024 * 1024;

/**
 * Avatar Upload Middleware
 */
export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: maxAvatarSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedAvatarMimeTypes.has(file.mimetype)) {
      return cb(
        new MyError({
          code: ErrorCode.VALIDATION_ERROR,
          message: `Invalid file type. Allowed: ${Array.from(
            allowedAvatarMimeTypes,
          ).join(", ")}`,
        }),
      );
    }
    cb(null, true);
  },
});

/**
 * Error handler for avatar uploads
 */
export const handleAvatarUploadError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HttpStatus.BAD_REQUEST).json(
        MyResponse.error({
          code: ErrorCode.VALIDATION_ERROR,
          message: `File too large. Max size is ${MAX_AVATAR_SIZE_MB}MB`,
        }),
      );
    }
    return res.status(HttpStatus.BAD_REQUEST).json(
      MyResponse.error({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Upload error: ${err.message}`,
      }),
    );
  }

  if (err instanceof MyError) {
    return res.status(HttpStatus.BAD_REQUEST).json(
      MyResponse.error({
        code: err.code,
        message: err.message,
      }),
    );
  }

  next(err);
};

/**
 * Ticket Attachments Upload Middleware
 */
export const ticketAttachmentsUpload = multer({
  storage,
  limits: {
    fileSize: maxTicketAttachmentSizeBytes,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTicketAttachmentMimeTypes.has(file.mimetype)) {
      return cb(
        new MyError({
          code: ErrorCode.VALIDATION_ERROR,
          message: `Invalid file type. Allowed: ${Array.from(
            allowedTicketAttachmentMimeTypes,
          ).join(", ")}`,
        }),
      );
    }
    cb(null, true);
  },
});

/**
 * Error handler for ticket attachments uploads
 */
export const handleTicketAttachmentsUploadError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HttpStatus.BAD_REQUEST).json(
        MyResponse.error({
          code: ErrorCode.VALIDATION_ERROR,
          message: `File too large. Max size is ${MAX_TICKET_ATTACHMENT_SIZE_MB}MB`,
        }),
      );
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(HttpStatus.BAD_REQUEST).json(
        MyResponse.error({
          code: ErrorCode.MAX_TRANSACTION_ATTACHMENTS_EXCEEDED,
          message: "Maximum 5 attachments are allowed per request.",
        }),
      );
    }

    return res.status(HttpStatus.BAD_REQUEST).json(
      MyResponse.error({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Upload error: ${err.message}`,
      }),
    );
  }

  if (err instanceof MyError) {
    return res.status(HttpStatus.BAD_REQUEST).json(
      MyResponse.error({
        code: err.code,
        message: err.message,
      }),
    );
  }

  next(err);
};
