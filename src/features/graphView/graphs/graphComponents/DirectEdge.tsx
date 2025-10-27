import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useInternalNode,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "../../helpers/utils";
import SelfConnectingEdge from "./SelfConnectingEdge";
import { DeleteElementButton } from "./PredicateNode";

interface DirectEdgeData extends Record<string, unknown> {
  duplicate?: boolean;
  error?: boolean;
}

export type DirectEdgeType = Edge<DirectEdgeData>;

export default function DirectEdge(props: EdgeProps<DirectEdgeType>) {
  const source = useInternalNode(props.source);
  const target = useInternalNode(props.target);

  const { deleteElements } = useReactFlow();

  if (!source || !target) return null;
  if (props.source === props.target) return <SelfConnectingEdge {...props} />;

  const { id, style } = props;
  const { sourceX, sourceY, targetX, targetY } = getEdgeParams(source, target);

  const [path, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const shouldError = props.data?.duplicate || props.data?.error;

  return (
    <>
      <BaseEdge
        id={id}
        className={`react-flow__edge-path ${shouldError ? "error" : ""}`}
        path={path}
        markerEnd={props.markerEnd}
        style={style}
      />
      <BaseEdge
        id={`${id}-error-focus`}
        className={`react-flow__edge-path-focus ${shouldError ? "error" : ""}`}
        path={path}
        markerEnd={props.markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        {shouldError && (
          <DeleteElementButton
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(0.6)`,
              pointerEvents: "all",
              zIndex: 100,
            }}
            className="nodrag nopan"
            onClick={() => deleteElements({ edges: [{ id }] })}
          >
            delete
          </DeleteElementButton>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export function GenerateMarker({ type }: { type: string }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <marker
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
      </defs>
    </svg>
  );
}
