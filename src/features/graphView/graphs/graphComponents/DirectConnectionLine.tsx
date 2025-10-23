import {
  getStraightPath,
  useConnection,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import { getEdgeParams } from "../../helpers/utils";

export default function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
  fromNode,
  toNode,
}: ConnectionLineComponentProps) {
  const connection = useConnection();

  const isValid = connection.isValid && toNode;

  const { sourceX, sourceY, targetX, targetY } = isValid
    ? getEdgeParams(fromNode, toNode!)
    : { sourceX: fromX, sourceY: fromY, targetX: toX, targetY: toY };

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const marker = isValid ? "url(#connection-marker)" : "";

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
        markerEnd={marker}
      />
    </g>
  );
}
