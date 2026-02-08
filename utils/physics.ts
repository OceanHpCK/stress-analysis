import { ProductDimensions } from '../types';

// Default values provided for initialization, but logic now relies on arguments
export const DEFAULT_MATERIAL = {
  name: "HDPE",
  yieldStrength: 26, // MPa
  modulus: 800 // MPa
};

/**
 * Calculates the height of the beam at a given X coordinate.
 */
export const getBeamHeightAtX = (x: number, dims: ProductDimensions): number => {
  if (x <= dims.leftWidth) {
    return dims.totalHeight;
  }

  const startSlopeX = dims.leftWidth;
  const endSlopeX = dims.leftWidth + dims.b;
  const startSlopeHeight = dims.totalHeight - dims.a;

  if (x > startSlopeX && x < endSlopeX) {
    const slopeRatio = (x - startSlopeX) / dims.b;
    return startSlopeHeight - (startSlopeHeight - dims.endHeight) * slopeRatio;
  }

  return dims.endHeight;
};

/**
 * Calculates Bending Stress (MPa) at a specific point (x,y).
 */
export const calculateStressMPa = (
  x: number,
  y: number,
  dims: ProductDimensions,
  forceX: number,
  forceMagnitude: number // in Newtons
): number => {
  const h = getBeamHeightAtX(x, dims);

  // Geometric check
  if (x < 0 || y < 0 || y > h) return 0;

  // Moment Calculation (Cantilever simplification)
  if (x > forceX) return 0;

  const distanceToLoad = Math.abs(forceX - x); // mm
  const moment = forceMagnitude * distanceToLoad; // N*mm

  // Geometric Properties
  const width = dims.width; // mm

  // Moment of Inertia I = (w * h^3) / 12
  const I = (width * Math.pow(h, 3)) / 12;

  // Distance from Neutral Axis
  const neutralAxis = h / 2;
  const distFromNA = Math.abs(y - neutralAxis);

  // Stress Formula: sigma = (M * y) / I
  let stress = (moment * distFromNA) / I; // N/mm^2 = MPa

  // Stress Concentration Factor (SCF) approximation
  const cornerX = dims.leftWidth;
  const cornerY = dims.totalHeight - dims.a;

  const distToCorner = Math.sqrt(Math.pow(x - cornerX, 2) + Math.pow(y - cornerY, 2));

  if (distToCorner < 15) {
    const scf = 2.0;
    const decay = Math.max(0, 1 - (distToCorner / 15));
    stress *= (1 + (scf - 1) * decay);
  }

  return stress;
};

/**
 * Helper to get stress at a specific X cross-section and Y position
 * If y is not provided, defaults to surface (y=0)
 */
export const getMaxStressAtSection = (
  x: number,
  dims: ProductDimensions,
  forceX: number,
  forceMagnitude: number,
  y?: number
): number => {
  // If y is provided, use it; otherwise use surface (y=0)
  const yPos = y !== undefined ? y : 0;
  return calculateStressMPa(x, yPos, dims, forceX, forceMagnitude);
}