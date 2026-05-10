import { Request, Response } from "express";
import { WebAuthnService } from "../../../modules/auth/webauthn.service";
import { AuthService } from "../../../services/auth.service";
import { ErrorCode, MyError } from "../../../types/error.type";
import { MyResponse } from "../../../types/response.type";
import { HttpStatus } from "../../../constants/httpStatus";
import { AuthRequest } from "../../../types/auth.type";

const webAuthnService = new WebAuthnService();
const authService = new AuthService();

const ensureObject = (body: unknown) => {
  if (!body || typeof body !== "object") {
    throw new MyError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid payload",
    });
  }

  return body as Record<string, unknown>;
};

const readString = (
  body: Record<string, unknown>,
  key: string,
  options: {
    required?: boolean;
    trim?: boolean;
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

  return options.trim === false ? value : value.trim();
};

export class WebAuthnController {
  async registerStart(req: AuthRequest, res: Response) {
    const userId = String(req.user.id);
    const options = await webAuthnService.generateRegistrationOptions(userId);
    res.status(HttpStatus.OK).json(MyResponse.success(options));
  }

  async registerFinish(req: AuthRequest, res: Response) {
    const body = ensureObject(req.body);
    const userId = String(req.user.id);
    const credential = body.credential as Record<string, unknown>;
    const deviceName = readString(body, "deviceName", {
      required: false,
      trim: true,
    });

    if (!credential || typeof credential !== "object") {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "credential is required",
      });
    }

    const result = await webAuthnService.verifyRegistrationResponse(
      userId,
      credential,
      deviceName,
    );
    res.status(HttpStatus.OK).json(MyResponse.success(result));
  }

  async loginStart(req: Request, res: Response) {
    const { options, challenge } =
      await webAuthnService.generateAuthenticationOptions();
    res.status(HttpStatus.OK).json(
      MyResponse.success({
        ...options,
        challenge,
        message:
          "Store challenge in client state and include in finish request",
      }),
    );
  }

  async loginFinish(req: Request, res: Response) {
    const body = ensureObject(req.body);
    const credential = body.credential as Record<string, unknown>;
    const challengeStr = readString(body, "challenge", { required: true });

    if (!credential || typeof credential !== "object") {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "credential is required",
      });
    }

    if (!challengeStr) {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "challenge is required",
      });
    }

    const user = await webAuthnService.verifyAuthenticationResponse(
      credential,
      challengeStr,
    );

    const tokenPair = await authService.issueTokenPair(user);
    res.status(HttpStatus.OK).json(MyResponse.success(tokenPair));
  }

  async getCredentials(req: AuthRequest, res: Response) {
    const userId = String(req.user.id);
    const credentials = await webAuthnService.getCredentialsForUser(userId);
    res.status(HttpStatus.OK).json(MyResponse.success(credentials));
  }

  async deleteCredential(req: AuthRequest, res: Response) {
    const userId = String(req.user.id);
    const credentialIdStr = readString(req.body, "credentialId", {
      required: true,
    });

    if (!credentialIdStr) {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "credentialId is required",
      });
    }

    const result = await webAuthnService.deleteCredential(
      userId,
      credentialIdStr,
    );
    res.status(HttpStatus.OK).json(MyResponse.success(result));
  }
}
