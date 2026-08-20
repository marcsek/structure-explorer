import { MARKER_TYPES } from "./edgeMarkers";

export default function EdgeMarkers() {
  return (
    <svg width={0} height={0} aria-hidden style={{ position: "absolute" }}>
      <defs>
        {MARKER_TYPES.map((type) => (
          <marker
            key={type}
            className={`react-flow__arrowhead ${type}`}
            id={`${type}-marker`}
            markerWidth="20"
            markerHeight="20"
            viewBox="-10 -10 20 20"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              className="arrowclosed"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
