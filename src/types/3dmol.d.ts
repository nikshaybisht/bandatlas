/**
 * Minimal ambient types for 3dmol (package ships no official types).
 * Only the surface BandAtlas uses.
 */
declare module '3dmol' {
  export interface Viewer {
    addModel(data: string, format: string): unknown
    setStyle(sel: object, style: object): void
    zoomTo(sel?: object): void
    render(): void
    clear(): void
    rotate(angle: number, axis: { x: number; y: number; z: number }): void
  }

  export interface CreateViewerConfig {
    backgroundColor?: string
    antialias?: boolean
  }

  export function createViewer(
    element: HTMLElement,
    config?: CreateViewerConfig,
  ): Viewer

  const _default: {
    createViewer: typeof createViewer
  }
  export default _default
}
