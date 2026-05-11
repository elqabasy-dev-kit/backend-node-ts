/**
 * @file src/utils/qr/index.ts
 * @description Utility functions for generating branded QR codes. This includes functions to create QR codes with custom styles, embed brand logos, and generate data URLs for the QR codes. It also provides helper functions for creating SVG elements used in the QR code rendering process.
 *              Also another usage is at the 2fa mdoule, where we can generate branded QR codes for the 2fa secrets, so the users can easily recognize the QR code as belonging to our application.
 * @author Mahros AL-Qabasy <mahros.dev>
 */
import { config } from "../../config";
import { getBrandLogoDataUrl } from "./logo";
import { renderBrandedQrSvg } from "./renderer";
import { QrStyle } from "./types";

function getDefaultStyle(): QrStyle {
  return {
    darkColor: config.brand.qr.darkColor,
    lightColor: config.brand.qr.lightColor,
    logoBackgroundColor: config.brand.qr.logoBackgroundColor,
    logoOpacity: config.brand.qr.logoOpacity,
  };
}

export async function generateBrandedQrSvg(content: string) {
  const logoDataUrl = await getBrandLogoDataUrl(
    config.brand.identityAssetsDir,
    config.brand.logoFileName,
  );

  return renderBrandedQrSvg(content, {
    width: config.brand.qr.width,
    margin: config.brand.qr.margin,
    logoScale: config.brand.qr.logoScale,
    style: getDefaultStyle(),
    logoDataUrl,
  });
}

export async function generateBrandedQrDataUrl(content: string) {
  const brandedSvg = await generateBrandedQrSvg(content);
  return `data:image/svg+xml;base64,${Buffer.from(brandedSvg).toString("base64")}`;
}

export { createQrLayout, getFinderOrigins, isInsideFinder } from "./layout";
export { clearBrandLogoCache, getBrandLogoDataUrl } from "./logo";
export {
  createDataModuleRect,
  createFinderEyeSvg,
  createLogoOverlaySvg,
  createSafeZoneSvg,
} from "./svg";
export { renderBrandedQrSvg } from "./renderer";
export type { FinderOrigin, QrLayout, QrStyle } from "./types";
