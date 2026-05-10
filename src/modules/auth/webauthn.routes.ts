import { Router } from "express";
import { WebAuthnController } from "../../controllers/v1";
import { authRateLimiter } from "../../utils/rateLimiter.util";

const router = Router();
const webAuthnController = new WebAuthnController();

/**
 * POST /webauthn/login/start
 * Start WebAuthn authentication (no authentication required)
 */
router.post("/login/start", authRateLimiter, (req, res, next) => {
  webAuthnController.loginStart(req, res).catch(next);
});

/**
 * POST /webauthn/login/finish
 * Complete WebAuthn authentication (no authentication required)
 */
router.post("/login/finish", authRateLimiter, (req, res, next) => {
  webAuthnController.loginFinish(req, res).catch(next);
});

export default router;
