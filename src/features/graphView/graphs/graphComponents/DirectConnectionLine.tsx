import {
  getStraightPath,
  useConnection,
  type ConnectionLineComponentProps,
} from "@xyflow/react";

export default function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  const connection = useConnection();

  return (
    <g>
      <path
        className="animated connection"
        style={{
          ...connectionLineStyle,
          stroke: connection.isValid ? "#22C55E99" : "red",
          strokeWidth: 2,
        }}
        fill="none"
        d={edgePath}
      />
    </g>
  );
}
