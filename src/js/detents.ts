import { NAME } from './constants';

/**
 * Where the sheet comes to rest after a gesture: either one of the configured
 * detents, or the closed position, which is not a detent of its own.
 */
export interface DetentTarget {
  /** The detent settled on, or null when the sheet should dismiss */
  detent: number | null;

  /** Absolute translateY of that target (px) */
  position: number;
}

/**
 * Parse a raw `detents` value into something `validateConfigTypes` can check.
 *
 * Data attributes arrive as strings, since `parseAttributeValue` only resolves
 * booleans, numbers, `null` and plain strings. Both a JSON array and a bare
 * comma-separated list are accepted:
 *
 * ```html
 * <div class="sheet" data-bs-detents="0.4,1"></div>
 * <div class="sheet" data-bs-detents="[0.4, 1]"></div>
 * ```
 *
 * Values that are not strings are returned untouched, so a `detents` array
 * passed through JavaScript reaches validation as-is.
 *
 * @param value - Raw option value
 * @returns The value with strings expanded into arrays
 */
export const parseDetents = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return trimmed.split(',').map((part) => Number(part.trim()));
};

/**
 * The set of resting positions a sheet supports.
 *
 * A detent is the fraction of the sheet's height that is visible: `1` is fully
 * open, `0.4` shows 40 %. This matches the `ratio` already reported by
 * `slide.bs.sheet`, so nothing public changes meaning.
 *
 * The layout model follows iOS: the sheet is laid out at its full height and
 * moved with `translateY`, so a detent is an offset rather than a height.
 * Closing is not a detent - a sheet rests at a detent or it is gone.
 */
export default class DetentModel {
  /** Configured detents, ascending and deduplicated */
  #list: readonly number[];

  /**
   * @param detents - Fractions in (0, 1]; order and duplicates do not matter
   * @throws {TypeError} If a value is not a number in (0, 1]
   */
  constructor(detents: readonly number[]) {
    if (detents.length === 0) {
      throw new TypeError(`[${NAME}] Option "detents" must list at least one value.`);
    }

    for (const detent of detents) {
      if (typeof detent !== 'number' || !Number.isFinite(detent) || detent <= 0 || detent > 1) {
        throw new TypeError(
          `[${NAME}] Option "detents" accepts numbers greater than 0 and up to 1, ` +
            `but received ${JSON.stringify(detent)}.`,
        );
      }
    }

    this.#list = Array.from(new Set(detents)).sort((a, b) => a - b);
  }

  /** Configured detents, ascending */
  get list(): readonly number[] {
    return this.#list;
  }

  /** Smallest configured detent, the default resting position */
  get smallest(): number {
    return this.#list[0];
  }

  /** Largest configured detent, past which the sheet rubber bands */
  get largest(): number {
    return this.#list[this.#list.length - 1];
  }

  /** Whether the sheet has more than one resting position */
  get isMultiDetent(): boolean {
    return this.#list.length > 1;
  }

  /**
   * Whether a value is one of the configured detents
   * @param detent - Value to look up
   */
  has(detent: number): boolean {
    return this.#list.includes(detent);
  }

  /**
   * Absolute translateY at which a detent rests
   * @param detent - One of the configured detents
   * @param sheetHeight - Total sheet height (px)
   */
  positionOf(detent: number, sheetHeight: number): number {
    return (1 - detent) * sheetHeight;
  }

  /**
   * The detent directly above the given one, or null when there is none
   * @param detent - Reference detent
   */
  above(detent: number): number | null {
    return this.#list.find((candidate) => candidate > detent) ?? null;
  }

  /**
   * Snap a projected resting position to the nearest target.
   *
   * The candidates are the configured detents plus the closed position, so
   * dismissal falls out of the same comparison rather than needing a threshold
   * of its own. Velocity is already accounted for: the projection is the
   * velocity model, so a hard flick overshoots and skips detents while a slow
   * drag lands on the neighbour.
   *
   * Ties resolve in favour of the more open target, which keeps the default
   * single-detent case behaving exactly as the midpoint rule it replaces.
   *
   * @param projectedPosition - Where the sheet would coast to (px)
   * @param sheetHeight - Total sheet height (px)
   */
  resolve(projectedPosition: number, sheetHeight: number): DetentTarget {
    // Ordered from the most open target downwards, so a tie is kept by the
    // candidate already reached rather than handed to the one below it
    const candidates: DetentTarget[] = [...this.#list].reverse().map((detent) => ({
      detent,
      position: this.positionOf(detent, sheetHeight),
    }));

    // Closed sits below every detent, so it is compared last and only wins
    // when it is strictly nearer than the smallest one
    candidates.push({ detent: null, position: sheetHeight });

    let best = candidates[0];
    let bestDistance = Math.abs(projectedPosition - best.position);

    for (const candidate of candidates.slice(1)) {
      const distance = Math.abs(projectedPosition - candidate.position);

      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }

    return best;
  }
}
