import {
  getStraightPath,
  useConnection,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import { getEdgeParams } from "../../helpers/utils";
import { useDispatch } from "react-redux";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { useEffect } from "react";
import { warningChanged } from "../graphSlice";

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
  const dispatch = useDispatch();
  const parentInfo = useGraphInfo();

  const isValid = connection.isValid && toNode;

  const { sourceX, sourceY, targetX, targetY } = isValid
    ? getEdgeParams(fromNode, toNode!)
    : { sourceX: fromX, sourceY: fromY, targetX: toX, targetY: toY };

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const marker = isValid ? "url(#connection-marker)" : "";

  useEffect(() => {
    if (!connection.toHandle?.id || connection.isValid)
      dispatch(warningChanged({ ...parentInfo, warning: undefined }));
  }, [connection.toHandle?.id, connection.isValid, dispatch, parentInfo]);

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
