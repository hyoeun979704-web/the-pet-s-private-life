export interface ShapeCell {
  dx: number;
  dy: number;
}

export interface BlockShape {
  id: string;
  cells: ShapeCell[];
  /** Width and height of the shape's bounding box (used for tray rendering). */
  width: number;
  height: number;
  /** Visual category — maps to one of three snack colors. */
  colorIndex: 0 | 1 | 2;
}

/**
 * Tray slot returned to the UI: contains the shape + a unique slot id so the
 * UI can animate slots independently when one is consumed.
 */
export interface TraySlot {
  slotId: string;
  shape: BlockShape;
}
