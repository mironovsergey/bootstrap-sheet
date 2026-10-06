/**
 * Input that drives a gesture: a mouse button or a finger.
 *
 * Coordinates are CSS pixels relative to the viewport.
 */
export default interface PointerInput {
  /** Put the pointer down at a point */
  press(x: number, y: number): Promise<void>;

  /** Move the pointer, still down, to a point */
  move(x: number, y: number): Promise<void>;

  /** Lift the pointer where it is */
  release(): Promise<void>;
}
