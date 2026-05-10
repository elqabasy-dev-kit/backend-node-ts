export interface FinderOrigin {
  row: number;
  col: number;
}

export interface QrLayout {
  canvasSize: number;
  moduleCount: number;
  moduleSize: number;
  offset: number;
  moduleRadius: number;
  logoSize: number;
  logoX: number;
  logoY: number;
  logoBackgroundX: number;
  logoBackgroundY: number;
  logoBackgroundSize: number;
  logoMaskMinX: number;
  logoMaskMinY: number;
  logoMaskMaxX: number;
  logoMaskMaxY: number;
}

export interface QrStyle {
  darkColor: string;
  lightColor: string;
  logoBackgroundColor: string;
  logoOpacity: number;
}
