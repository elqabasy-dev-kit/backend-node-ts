/**
 * @file middlewares/bot.middleware.ts
 * @description Middleware to detect and block requests from known bots and scanners based on User-Agent.
 *              It blocks common security scanning tools and search engine bots, while allowing legitimate tools like Postman.
 * @author Mahros AL-Qabasy <mahros.dev>
 */

import { Request, Response, NextFunction } from "express";

const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nmap/i,
  /nikto/i,
  /masscan/i,
  /python-requests/i,
  /zmap/i,
  /googlebot/i,
  /bingbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
];

const PROD_ONLY_BLOCKED_USER_AGENTS = [/curl/i, /wget/i];

const ALLOWED_USER_AGENTS = [/PostmanRuntime/i];




export const botDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => { }