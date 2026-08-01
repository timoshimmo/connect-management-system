/**
 * Feature flags for modules that are fully built but temporarily out of
 * product scope. Flip a flag back to `false` to hide a module again — the
 * routes/components/nav entries it gates are left in place, never deleted.
 */
export const FEATURES = {
  /**
   * STAC Drawing Register — a separately-authenticated storefront for
   * documents whose destination is 'Drawing Register' (see
   * document.model.js). Gates: router/index.tsx's drawing-register routes,
   * the Dashboard's DrawingRegisterCard, and the Read Site's "Drawings and
   * Diagrams" link.
   */
  drawingRegister: true,
} as const;
