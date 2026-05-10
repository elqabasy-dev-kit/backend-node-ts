import { Request } from "express";

export interface WebAuthnRegisterStartDTO {
  userId: string;
}

export interface WebAuthnRegisterFinishDTO {
  credential: Record<string, unknown>;
  deviceName?: string;
}

export interface WebAuthnLoginFinishDTO {
  credential: Record<string, unknown>;
}

export interface WebAuthnRegisterStartResponse {
  challenge: string;
  rp: { name: string };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  attestation: string;
}

export interface WebAuthnLoginStartResponse {
  challenge: string;
  allowCredentials: Array<{
    id: string;
    type: string;
  }>;
}

export interface WebAuthnAuthRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  webAuthnChallenge?: string;
}
