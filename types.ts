export interface ProductDimensions {
  totalHeight: number; // 100mm
  leftWidth: number; // 52mm
  endHeight: number; // 47mm
  totalLength: number; // For visualization, e.g., 250mm
  a: number; // Vertical drop before slope (mm)
  b: number; // Horizontal length of slope (mm)
  width: number; // Thickness of the beam (mm)
}

export interface MaterialConfig {
  name: string;
  yieldStrength: number; // MPa
  modulus: number; // MPa
}

export enum ForceType {
  F = 'F',   // Downward
  F2 = 'F2'  // Upward
}

export interface ForceConfig {
  type: ForceType;
  positionX: number; // mm from left (0)
  magnitude: number; // Newtons
}

export interface Point {
  x: number;
  y: number;
}