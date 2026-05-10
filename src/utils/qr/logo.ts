import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";

const logoCache = new Map<string, string | null>();

function getMimeType(logoPath: string) {
  const extension = path.extname(logoPath).toLowerCase();
  if (extension === ".svg") {
    return "image/svg+xml";
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  if (extension === ".ico") {
    return "image/x-icon";
  }

  return "image/png";
}

export async function getBrandLogoDataUrl(
  identityAssetsDir: string,
  logoFileName: string,
) {
  const logoPath = path.resolve(identityAssetsDir, logoFileName);
  const cached = logoCache.get(logoPath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const logoBuffer = await fs.readFile(logoPath);
    const mimeType = getMimeType(logoPath);
    const dataUrl = `data:${mimeType};base64,${logoBuffer.toString("base64")}`;
    logoCache.set(logoPath, dataUrl);
    return dataUrl;
  } catch (error) {
    logger.warn(
      "Brand logo not found; QR code will be generated without logo",
      {
        logoPath,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    logoCache.set(logoPath, null);
    return null;
  }
}

export function clearBrandLogoCache() {
  logoCache.clear();
}
