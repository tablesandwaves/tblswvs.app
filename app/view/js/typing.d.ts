export {};
declare var window: Window;
declare global {
  interface Window {
    stepSequencer: any;
    parameters: any;
    documentation: any;
    d3: any;
  }
}
