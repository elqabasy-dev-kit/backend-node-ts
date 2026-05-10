import { FinderOrigin, QrLayout } from "./types";

const FINDER_SIZE = 7;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isInsideFinder(row: number, col: number, moduleCount: number) {
  const inTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const inTopRight = row < FINDER_SIZE && col >= moduleCount - FINDER_SIZE;
  const inBottomLeft = row >= moduleCount - FINDER_SIZE && col < FINDER_SIZE;

  return inTopLeft || inTopRight || inBottomLeft;
}

export function getFinderOrigins(moduleCount: number): FinderOrigin[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - FINDER_SIZE },
    { row: moduleCount - FINDER_SIZE, col: 0 },
  ];
}

export function createQrLayout(
  moduleCount: number,
  width: number,
  margin: number,
  logoScale: number,
): QrLayout {
  const canvasSize = width;
  const marginModules = Math.max(0, margin);
  const safeLogoScale = clamp(logoScale, 0.1, 0.4);
  const totalModules = moduleCount + marginModules * 2;
  const moduleSize = canvasSize / totalModules;
  const offset = marginModules * moduleSize;

  const logoSize = canvasSize * safeLogoScale;
  const logoX = (canvasSize - logoSize) / 2;
  const logoY = (canvasSize - logoSize) / 2;
  const logoBackgroundPadding = logoSize * 0.14;
  const logoBackgroundX = logoX - logoBackgroundPadding;
  const logoBackgroundY = logoY - logoBackgroundPadding;
  const logoBackgroundSize = logoSize + logoBackgroundPadding * 2;

  return {
    canvasSize,
    moduleCount,
    moduleSize,
    offset,
    moduleRadius: moduleSize * 0.44,
    logoSize,
    logoX,
    logoY,
    logoBackgroundX,
    logoBackgroundY,
    logoBackgroundSize,
    logoMaskMinX: logoBackgroundX,
    logoMaskMinY: logoBackgroundY,
    logoMaskMaxX: logoBackgroundX + logoBackgroundSize,
    logoMaskMaxY: logoBackgroundY + logoBackgroundSize,
  };
}
