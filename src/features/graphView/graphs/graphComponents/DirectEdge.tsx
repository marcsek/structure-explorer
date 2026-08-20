import "./graphComponents.css";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useInternalNode,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { useState } from "react";

import { getEdgeParams, getSelfLoopPath } from "../../helpers/utils";
import DeleteElementButton from "./DeleteElementButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface DirectEdgeData extends Record<string, unknown> {
  duplicate?: boolean;
  error?: boolean;
  helper?: boolean;
}

export type DirectEdgeType = Edge<DirectEdgeData>;

export default function DirectEdge(props: EdgeProps<DirectEdgeType>) {
  const source = useInternalNode(props.source);
  const target = useInternalNode(props.target);

  const { deleteElements } = useReactFlow();

  const [labelHovered, setLabelHovered] = useState(false);

  if (!source || !target) return null;

  const { id, style } = props;

  const [path, labelX, labelY] =
    props.source === props.target
      ? getSelfLoopPath(props.sourceX, props.sourceY)
      : getStraightPath(getEdgeParams(source, target));

  const shouldError = props.data?.duplicate || props.data?.error;

  let labelContent = null;

  if (shouldError) {
    labelContent = (
      <DeleteElementButton
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(0.6)`,
        }}
        className="nodrag nopan predicate-edge-delete-button"
        onClick={() => deleteElements({ edges: [{ id }] })}
        onMouseEnter={() => setLabelHovered(true)}
        onMouseLeave={() => setLabelHovered(false)}
      />
    );
  } else if (props.data?.helper) {
    labelContent = (
      <FontAwesomeIcon
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(0.8)`,
        }}
        className="nodrag nopan predicate-edge-helper-icon"
        size="sm"
        icon={faStar}
      />
    );
  }

  return (
    <>
      <BaseEdge
        id={id}
        className={`react-flow__edge-path ${shouldError ? "error" : ""} ${props.data?.helper ? "helper" : ""} ${labelHovered ? "label-hover" : ""}`}
        path={path}
        style={style}
      />

      <BaseEdge
        id={`${id}-error-focus`}
        className={`react-flow__edge-path-focus ${shouldError ? "error" : ""} ${labelHovered ? "label-hover" : ""}`}
        path={path}
        style={style}
      />

      <EdgeLabelRenderer>{labelContent}</EdgeLabelRenderer>
    </>
  );
}
