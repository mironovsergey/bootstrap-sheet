export interface BootstrapSheetOptions {
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  focus?: boolean;
  gestures?: boolean;
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
