import {
  getStraightPath,
  useConnection,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import { getEdgeParams } from "./edgeGeometry";

export default function DirectConnectionLine({
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

  return (
    <path
      className={`animated connection ${connection.isValid ? "valid" : "invalid"}`}
      style={connectionLineStyle}
      d={edgePath}
    />
  );
}
