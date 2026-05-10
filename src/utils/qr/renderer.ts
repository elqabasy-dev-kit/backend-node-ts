import QRCode from "qrcode";
import { createQrLayout, getFinderOrigins, isInsideFinder } from "./layout";
import {
  createDataModuleRect,
  createFinderEyeSvg,
  createLogoOverlaySvg,
  createSafeZoneSvg,
} from "./svg";
import { QrStyle } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function renderBrandedQrSvg(
  content: string,
  options: {
    width: number;
    margin: number;
    logoScale: number;
    style: QrStyle;
    logoDataUrl?: string | null;
  },
) {
  const qr = QRCode.create(content, {
    errorCorrectionLevel: "H",
  });

  const layout = createQrLayout(
    qr.modules.size,
    options.width,
    options.margin,
    options.logoScale,
  );

  const moduleRects: string[] = [];
  for (let row = 0; row < layout.moduleCount; row += 1) {
    for (let col = 0; col < layout.moduleCount; col += 1) {
      if (!qr.modules.get(row, col)) {
        continue;
      }

      if (isInsideFinder(row, col, layout.moduleCount)) {
        continue;
      }

      const x = layout.offset + col * layout.moduleSize;
      const y = layout.offset + row * layout.moduleSize;
      const centerX = x + layout.moduleSize / 2;
      const centerY = y + layout.moduleSize / 2;
      const insideLogoMask =
        centerX >= layout.logoMaskMinX &&
        centerX <= layout.logoMaskMaxX &&
        centerY >= layout.logoMaskMinY &&
        centerY <= layout.logoMaskMaxY;

      if (insideLogoMask) {
        continue;
      }

      moduleRects.push(
        createDataModuleRect(
          x,
          y,
          layout.moduleSize,
          layout.moduleRadius,
          options.style.darkColor,
        ),
      );
    }
  }

  const finderEyes = getFinderOrigins(layout.moduleCount)
    .map(({ row, col }) => {
      const x = layout.offset + col * layout.moduleSize;
      const y = layout.offset + row * layout.moduleSize;
      return createFinderEyeSvg(
        x,
        y,
        layout.moduleSize * 7,
        options.style.darkColor,
        options.style.lightColor,
      );
    })
    .join("");

  const safeZoneSvg = createSafeZoneSvg(
    layout,
    options.style.logoBackgroundColor,
  );
  const logoOpacity = clamp(options.style.logoOpacity, 0.2, 1);
  const logoOverlay = options.logoDataUrl
    ? createLogoOverlaySvg(layout, options.logoDataUrl, logoOpacity)
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvasSize}" height="${layout.canvasSize}" viewBox="0 0 ${layout.canvasSize} ${layout.canvasSize}">`,
    `<rect x="0" y="0" width="${layout.canvasSize}" height="${layout.canvasSize}" fill="${options.style.lightColor}"/>`,
    moduleRects.join(""),
    finderEyes,
    safeZoneSvg,
    logoOverlay,
    "</svg>",
  ].join("");
}
