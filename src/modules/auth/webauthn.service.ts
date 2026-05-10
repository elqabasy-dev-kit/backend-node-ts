import crypto from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { prisma } from "../../db";
import { ErrorCode, MyError } from "../../types/error.type";

interface ChallengeRecord {
  challenge: string;
  expiresAt: number;
}

const challengeCache = new Map<string, ChallengeRecord>();

function generateChallenge(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function storeChallengeForUser(userId: string, challenge: string): void {
  const key = `webauthn-challenge-${userId}`;
  challengeCache.set(key, {
    challenge,
    expiresAt: Date.now() + config.WEBAUTHN_CHALLENGE_EXPIRES_IN_MS,
  });
}

function retrieveAndClearChallenge(userId: string): string | null {
  const key = `webauthn-challenge-${userId}`;
  const record = challengeCache.get(key);

  if (!record) {
    return null;
  }

  if (Date.now() > record.expiresAt) {
    challengeCache.delete(key);
    return null;
  }

  challengeCache.delete(key);
  return record.challenge;
}

function toBase64Url(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeBase64LikeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return toBase64Url(trimmed);
}

function normalizeCredentialPayload(
  credentialJSON: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...credentialJSON,
  };

  const normalizedId =
    normalizeBase64LikeString(credentialJSON.id) ||
    normalizeBase64LikeString(credentialJSON.rawId);

  if (normalizedId) {
    normalized.id = normalizedId;
    normalized.rawId = normalizedId;
  }

  const response = credentialJSON.response;
  if (response && typeof response === "object") {
    const responsePayload = response as Record<string, unknown>;
    normalized.response = {
      ...responsePayload,
      ...(normalizeBase64LikeString(responsePayload.clientDataJSON)
        ? {
            clientDataJSON: normalizeBase64LikeString(
              responsePayload.clientDataJSON,
            ),
          }
        : {}),
      ...(normalizeBase64LikeString(responsePayload.attestationObject)
        ? {
            attestationObject: normalizeBase64LikeString(
              responsePayload.attestationObject,
            ),
          }
        : {}),
      ...(normalizeBase64LikeString(responsePayload.authenticatorData)
        ? {
            authenticatorData: normalizeBase64LikeString(
              responsePayload.authenticatorData,
            ),
          }
        : {}),
      ...(normalizeBase64LikeString(responsePayload.signature)
        ? {
            signature: normalizeBase64LikeString(responsePayload.signature),
          }
        : {}),
      ...(normalizeBase64LikeString(responsePayload.userHandle)
        ? {
            userHandle: normalizeBase64LikeString(responsePayload.userHandle),
          }
        : {}),
    };
  }

  return normalized;
}

function doesChallengeMatch(
  expectedChallenge: string,
  actualChallenge: string,
) {
  if (actualChallenge === expectedChallenge) {
    return true;
  }

  const encodedExpected = Buffer.from(expectedChallenge, "utf8").toString(
    "base64url",
  );
  return actualChallenge === encodedExpected;
}

function resolveAuthChallenge(challenge: string): string | null {
  const directKey = `webauthn-auth-challenge-${challenge}`;
  if (challengeCache.has(directKey)) {
    return challenge;
  }

  try {
    const decoded = Buffer.from(challenge, "base64").toString("utf8");
    const decodedKey = `webauthn-auth-challenge-${decoded}`;
    if (challengeCache.has(decodedKey)) {
      return decoded;
    }
  } catch {
    // Ignore invalid base64 inputs and fall back to original behavior.
  }

  return null;
}

export class WebAuthnService {
  async generateRegistrationOptions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new MyError({
        code: ErrorCode.UNAUTHORIZED,
        message: "User not found",
      });
    }

    const challenge = generateChallenge();
    storeChallengeForUser(userId, challenge);

    const options = await generateRegistrationOptions({
      rpName: config.WEBAUTHN_RP_NAME,
      rpID: config.WEBAUTHN_RP_ID,
      userID: Buffer.from(userId),
      userName: user.username || "user",
      userDisplayName:
        `${user.fName || ""} ${user.lName || ""}`.trim() ||
        user.username ||
        "User",
      challenge,
      timeout: config.WEBAUTHN_CHALLENGE_TIMEOUT_MS,
      attestationType: "none",
      supportedAlgorithmIDs: [-7],
    });

    return options;
  }

  async verifyRegistrationResponse(
    userId: string,
    credentialJSON: Record<string, unknown>,
    deviceName?: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new MyError({
        code: ErrorCode.UNAUTHORIZED,
        message: "User not found",
      });
    }

    const storedChallenge = retrieveAndClearChallenge(userId);
    if (!storedChallenge) {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid or expired challenge",
      });
    }

    try {
      const normalizedCredential = normalizeCredentialPayload(credentialJSON);

      const verification = await verifyRegistrationResponse({
        response: normalizedCredential as any,
        expectedChallenge: (challenge) =>
          doesChallengeMatch(storedChallenge, challenge),
        expectedOrigin: config.WEBAUTHN_ALLOWED_ORIGINS,
        expectedRPID: config.WEBAUTHN_RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        throw new MyError({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Registration verification failed",
        });
      }

      const { credential } = verification.registrationInfo;
      if (!credential) {
        throw new MyError({
          code: ErrorCode.VALIDATION_ERROR,
          message: "No credential found in verification",
        });
      }

      const existingCredential = await prisma.webAuthnCredential.findUnique({
        where: { credentialId: credential.id },
      });
      if (existingCredential) {
        throw new MyError({
          code: ErrorCode.CONFLICT,
          message: "This credential is already registered",
        });
      }

      // Convert publicKey to Buffer if it's a Uint8Array (Prisma Bytes uses Buffer)
      const publicKeyBuffer =
        credential.publicKey instanceof Uint8Array
          ? Buffer.from(credential.publicKey)
          : Buffer.from(credential.publicKey as any);

      await prisma.webAuthnCredential.create({
        data: {
          userId,
          credentialId: credential.id,
          publicKey: publicKeyBuffer,
          counter: credential.counter || 0,
          deviceName: deviceName?.trim() || null,
        },
      });

      logger.info("WebAuthn credential registered", {
        userId,
        credentialId: credential.id,
        deviceName: deviceName || "Unknown",
      });

      return {
        message: "WebAuthn credential registered successfully",
        credentialId: credential.id,
      };
    } catch (error) {
      if (error instanceof MyError) {
        throw error;
      }

      logger.error("WebAuthn registration verification failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Registration verification failed",
      });
    }
  }

  async generateAuthenticationOptions() {
    const challenge = generateChallenge();

    const credentials = await prisma.webAuthnCredential.findMany({
      select: { credentialId: true },
    });

    const options = await generateAuthenticationOptions({
      rpID: config.WEBAUTHN_RP_ID,
      challenge,
      timeout: config.WEBAUTHN_CHALLENGE_TIMEOUT_MS,
      userVerification: "preferred",
      allowCredentials: credentials.map((cred: { credentialId: any }) => ({
        id: cred.credentialId,
        type: "public-key" as const,
        transports: ["internal"],
      })),
    });

    const key = `webauthn-auth-challenge-${challenge}`;
    challengeCache.set(key, {
      challenge,
      expiresAt: Date.now() + config.WEBAUTHN_CHALLENGE_EXPIRES_IN_MS,
    });

    return { options, challenge };
  }

  async verifyAuthenticationResponse(
    credentialJSON: Record<string, unknown>,
    challenge: string,
  ) {
    const resolvedChallenge = resolveAuthChallenge(challenge) || challenge;
    const key = `webauthn-auth-challenge-${resolvedChallenge}`;
    const record = challengeCache.get(key);

    if (!record) {
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid or expired challenge",
      });
    }

    if (Date.now() > record.expiresAt) {
      challengeCache.delete(key);
      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Challenge expired",
      });
    }

    try {
      const normalizedCredential = normalizeCredentialPayload(credentialJSON);
      const credentialId = (
        normalizedCredential.id ||
        normalizedCredential.rawId ||
        ""
      ).toString();

      const webAuthnCredential = await prisma.webAuthnCredential.findUnique({
        where: { credentialId },
      });

      if (!webAuthnCredential) {
        throw new MyError({
          code: ErrorCode.UNAUTHORIZED,
          message: "Credential not found",
        });
      }

      const verification = await verifyAuthenticationResponse({
        response: normalizedCredential as any,
        expectedChallenge: (actualChallenge) =>
          doesChallengeMatch(resolvedChallenge, actualChallenge),
        expectedOrigin: config.WEBAUTHN_ALLOWED_ORIGINS,
        expectedRPID: config.WEBAUTHN_RP_ID,
        credential: {
          id: webAuthnCredential.credentialId,
          publicKey: new Uint8Array(webAuthnCredential.publicKey),
          counter: webAuthnCredential.counter,
          transports: [],
        },
      });

      if (!verification.verified) {
        throw new MyError({
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication verification failed",
        });
      }

      if (
        verification.authenticationInfo &&
        verification.authenticationInfo.newCounter <= webAuthnCredential.counter
      ) {
        logger.warn("Potential replay attack detected", {
          credentialId,
          storedCounter: webAuthnCredential.counter,
          newCounter: verification.authenticationInfo.newCounter,
        });

        throw new MyError({
          code: ErrorCode.FORBIDDEN,
          message: "Possible replay attack detected",
        });
      }

      if (verification.authenticationInfo) {
        await prisma.webAuthnCredential.update({
          where: { credentialId },
          data: { counter: verification.authenticationInfo.newCounter },
        });
      }

      challengeCache.delete(key);

      const user = await prisma.user.findUnique({
        where: { id: webAuthnCredential.userId },
      });
      if (!user || !user.active) {
        throw new MyError({
          code: ErrorCode.UNAUTHORIZED,
          message: "User not found or inactive",
        });
      }

      logger.info("WebAuthn authentication successful", {
        userId: user.id,
        credentialId,
      });

      return user;
    } catch (error) {
      if (error instanceof MyError) {
        throw error;
      }

      logger.error("WebAuthn authentication verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new MyError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Authentication verification failed",
      });
    }
  }

  async getCredentialsForUser(userId: string) {
    return prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        credentialId: true,
        deviceName: true,
        createdAt: true,
      },
    });
  }

  async deleteCredential(userId: string, credentialId: string) {
    try {
      await prisma.webAuthnCredential.delete({
        where: {
          credentialId,
          userId, // Ensure ownership
        },
      });

      logger.info("WebAuthn credential deleted", {
        userId,
        credentialId,
      });

      return { message: "Credential deleted successfully" };
    } catch (error) {
      throw new MyError({
        code: ErrorCode.NOT_FOUND,
        message: "Credential not found",
      });
    }
  }
}
