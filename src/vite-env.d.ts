/// <reference types="vite/client" />

declare module '3dmol' {
  export interface GLViewer {
    addModel: (data: string, format: string) => void
    setStyle: (sel: object, style: object) => void
    zoomTo: () => void
    render: () => void
    rotate: (angle: number, axis: { x?: number; y?: number; z?: number }) => void
    clear: () => void
  }

  export function createViewer(
    element: HTMLElement,
    config?: Record<string, unknown>,
  ): GLViewer

  const $3Dmol: {
    createViewer: typeof createViewer
  }

  export default $3Dmol
}
