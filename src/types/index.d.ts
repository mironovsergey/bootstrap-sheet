export interface BootstrapSheetOptions {
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  focus?: boolean;
  gestures?: boolean;
  swipeThreshold?: number;
  velocityThreshold?: number;
  minCloseDistance?: number;
  closeThresholdRatio?: number;
  animationDuration?: number;
  projectionTime?: number;
  dragResistanceUp?: number;
  dragResistanceDown?: number;
}

export default class BootstrapSheet {
  constructor(element: HTMLElement | string, options?: BootstrapSheetOptions);
  static NAME: string;
  static Default: BootstrapSheetOptions;
  static getInstance(element: HTMLElement | string): BootstrapSheet | null;
  static getOrCreateInstance(
    element: HTMLElement | string,
    options?: BootstrapSheetOptions,
  ): BootstrapSheet;
  get isShown(): boolean;
  get isTransitioning(): boolean;
  show(): void;
  hide(): void;
  toggle(): void;
  dispose(): void;
}
