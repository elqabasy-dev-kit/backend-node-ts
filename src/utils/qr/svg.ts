import { QrLayout } from "./types";

function escapeXmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

export function createFinderEyeSvg(
  x: number,
  y: number,
  size: number,
  darkColor: string,
  lightColor: string,
) {
  const outerRadius = size * 0.24;
  const middleInset = size / 7;
  const middleSize = size - middleInset * 2;
  const middleRadius = middleSize * 0.21;
  const innerInset = (size / 7) * 2;
  const innerSize = size - innerInset * 2;
  const innerRadius = innerSize * 0.3;

  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${outerRadius}" fill="${darkColor}"/>`,
    `<rect x="${x + middleInset}" y="${y + middleInset}" width="${middleSize}" height="${middleSize}" rx="${middleRadius}" fill="${lightColor}"/>`,
    `<rect x="${x + innerInset}" y="${y + innerInset}" width="${innerSize}" height="${innerSize}" rx="${innerRadius}" fill="${darkColor}"/>`,
  ].join("");
}

export function createDataModuleRect(
  x: number,
  y: number,
  moduleSize: number,
  moduleRadius: number,
  color: string,
) {
  return `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" rx="${moduleRadius}" fill="${color}"/>`;
}

export function createSafeZoneSvg(layout: QrLayout, backgroundColor: string) {
  return `<rect x="${layout.logoBackgroundX}" y="${layout.logoBackgroundY}" width="${layout.logoBackgroundSize}" height="${layout.logoBackgroundSize}" rx="${layout.logoBackgroundSize * 0.18}" fill="${backgroundColor}"/>`;
}

export function createLogoOverlaySvg(
  layout: QrLayout,
  logoDataUrl: string,
  logoOpacity: number,
) {
  return `<image x="${layout.logoX}" y="${layout.logoY}" width="${layout.logoSize}" height="${layout.logoSize}" href="${escapeXmlAttribute(logoDataUrl)}" preserveAspectRatio="xMidYMid meet" opacity="${logoOpacity}"/>`;
}
