/**
 * Annotation Utility Functions
 * Helper functions for annotation calculations and transformations
 */

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle coordinates (normalized)
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates a normalized rectangle bounding box (x, y, width, height)
 * given any two diagonal points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Normalized rectangle with top-left origin
 */
export function calculate_rectangle_coords(
  p1: Point,
  p2: Point
): Rectangle {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const width = Math.abs(p1.x - p2.x);
  const height = Math.abs(p1.y - p2.y);
  
  return { x, y, width, height };
}

/**
 * Convert rectangle to PDF rect format [x1, y1, x2, y2]
 * @param rect - Rectangle with x, y, width, height
 * @returns PDF rect array [x1, y1, x2, y2]
 */
export function rectangle_to_pdf_rect(rect: Rectangle): [number, number, number, number] {
  return [
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y + rect.height,
  ];
}

/**
 * Convert PDF rect format [x1, y1, x2, y2] to rectangle
 * @param pdf_rect - PDF rect array [x1, y1, x2, y2]
 * @returns Rectangle with x, y, width, height
 */
export function pdf_rect_to_rectangle(
  pdf_rect: [number, number, number, number]
): Rectangle {
  const [x1, y1, x2, y2] = pdf_rect;
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/**
 * Check if a rectangle is too small (likely a click, not a drag)
 * @param rect - Rectangle to check
 * @param min_size - Minimum size in pixels (default: 5)
 * @returns True if rectangle is too small
 */
export function is_rectangle_too_small(
  rect: Rectangle,
  min_size: number = 5
): boolean {
  return rect.width < min_size || rect.height < min_size;
}

