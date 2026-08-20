export const MARKER_TYPES = [
  "default",
  "error",
  "focusError",
  "selected",
  "hover",
  "connection",
] as const;

export type EdgeMarkerType = (typeof MARKER_TYPES)[number];

export const markerUrl = (type: EdgeMarkerType) => `url(#${type}-marker)`;
