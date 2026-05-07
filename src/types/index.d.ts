export interface BootstrapSheetOptions {
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  focus?: boolean;
  gestures?: boolean;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  swipeThreshold?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  velocityThreshold?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  minCloseDistance?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  closeThresholdRatio?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  animationDuration?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  projectionTime?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  dragResistanceUp?: number;
  /** @deprecated since 0.2.0 - use `springDampingRatio` and `springResponse` instead */
  dragResistanceDown?: number;
  springDampingRatio?: number;
  springResponse?: number;
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
