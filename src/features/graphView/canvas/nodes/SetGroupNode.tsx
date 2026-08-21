import "./SetGroupNode.css";

import type { OriginSet } from "../../graphs/bipartite/model";
import { type Node, type NodeProps } from "@xyflow/react";

type SetGroupNodeData = {
  origin: OriginSet;
  label: string;
};

export type SetGroupNodeType = Node<SetGroupNodeData>;

export default function SetGroupNode({ data }: NodeProps<SetGroupNodeType>) {
  return (
    <div className="set-group-node-body">
      <span className="set-group-node-label">{data.label}</span>
      <svg className="set-group-node-border">
        <rect
          className="set-group-node-border-rect"
          x="1"
          y="1"
          rx="10"
          ry="10"
        />
      </svg>
    </div>
  );
}
