import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "../../helpers/utils";
import SelfConnectingEdge from "./SelfConnectingEdge";

interface DirectEdgeData extends Record<string, unknown> {
  duplicate?: boolean;
  error?: boolean;
}

export type DirectEdgeType = Edge<DirectEdgeData>;

export default function DirectEdge(props: EdgeProps<DirectEdgeType>) {
  const source = useInternalNode(props.source);
  const target = useInternalNode(props.target);

  if (!source || !target) return null;
  if (props.source === props.target) return <SelfConnectingEdge {...props} />;

  const { id, markerEnd, style } = props;
  const { sx, sy, tx, ty } = getEdgeParams(source, target);

  const [path] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const shouldError = props.data?.duplicate || props.data?.error;

  return (
    <BaseEdge
      id={id}
      className={`react-flow__edge-path ${shouldError ? "error" : ""}`}
      path={path}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
