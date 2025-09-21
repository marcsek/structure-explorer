import {
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type HTMLAttributes,
  useRef,
  useEffect,
} from "react";
import { Panel } from "@xyflow/react";

import {
  useNodes,
  ViewportPortal,
  useReactFlow,
  type XYPosition,
} from "@xyflow/react";

type NodeInfoProps = {
  id: string;
  type: string;
  selected: boolean;
  position: XYPosition;
  absPosition: XYPosition;
  width?: number;
  height?: number;
  // eslint-disable-next-line
  data: any;
};

function NodeInfo({
  id,
  type,
  selected,
  position,
  absPosition,
  width,
  height,
  data,
}: NodeInfoProps) {
  if (!width || !height) {
    return null;
  }

  return (
    <div
      className="react-flow__devtools-nodeinfo"
      style={{
        position: "absolute",
        transform: `translate(${absPosition.x}px, ${absPosition.y + height}px)`,
        width: width * 2,
        fontSize: "0.40rem",
      }}
    >
      <div>id: {id}</div>
      <div>type: {type}</div>
      <div>selected: {selected ? "true" : "false"}</div>
      <div>
        position: {position.x.toFixed(1)}, {position.y.toFixed(1)}
      </div>
      <div>
        dimensions: {width} × {height}
      </div>
      <div>data: {JSON.stringify(data, null, 2)}</div>
    </div>
  );
}

export default function DevTools() {
  const [nodeInspectorActive, setNodeInspectorActive] = useState(true);
  const [changeLoggerActive, setChangeLoggerActive] = useState(true);

  return (
    <div className="react-flow__devtools">
      <Panel position="top-left">
        <DevToolButton
          setActive={setNodeInspectorActive}
          active={nodeInspectorActive}
          title="Toggle Node Inspector"
        >
          Node Inspector
        </DevToolButton>
        <DevToolButton
          setActive={setChangeLoggerActive}
          active={changeLoggerActive}
          title="Toggle Change Logger"
        >
          Change Logger
        </DevToolButton>
      </Panel>
      {changeLoggerActive && <ChangeLogger />}
      {nodeInspectorActive && <NodeInspector />}
    </div>
  );
}

function DevToolButton({
  active,
  setActive,
  children,
  ...rest
}: {
  active: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
} & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={() => setActive((a) => !a)}
      className={active ? "active" : ""}
      {...rest}
    >
      {children}
    </button>
  );
}

function NodeInspector() {
  const { getInternalNode } = useReactFlow();
  const nodes = useNodes();

  return (
    <ViewportPortal>
      <div className="react-flow__devtools-nodeinspector">
        {nodes.map((node) => {
          const internalNode = getInternalNode(node.id);
          if (!internalNode) {
            return null;
          }

          const absPosition = internalNode?.internals.positionAbsolute;

          return (
            <NodeInfo
              key={node.id}
              id={node.id}
              selected={!!node.selected}
              type={node.type || "default"}
              position={node.position}
              absPosition={absPosition}
              width={node.measured?.width ?? 0}
              height={node.measured?.height ?? 0}
              data={node.data}
            />
          );
        })}
      </div>
    </ViewportPortal>
  );
}

import {
  useStore,
  useStoreApi,
  type OnNodesChange,
  type NodeChange,
} from "@xyflow/react";

type ChangeLoggerProps = {
  color?: string;
  limit?: number;
};

type ChangeInfoProps = {
  change: NodeChange;
};

function ChangeInfo({ change }: ChangeInfoProps) {
  const id = "id" in change ? change.id : "-";
  const { type } = change;

  return (
    <div style={{ marginBottom: 4 }}>
      <div>node id: {id}</div>
      <div>
        {type === "add" ? JSON.stringify(change.item, null, 2) : null}
        {type === "dimensions"
          ? `dimensions: ${change.dimensions?.width} × ${change.dimensions?.height}`
          : null}
        {type === "position"
          ? `position: ${change.position?.x.toFixed(
              1,
            )}, ${change.position?.y.toFixed(1)}`
          : null}
        {type === "remove" ? "remove" : null}
        {type === "select" ? (change.selected ? "select" : "unselect") : null}
      </div>
    </div>
  );
}

function ChangeLogger({ limit = 20 }: ChangeLoggerProps) {
  const [changes, setChanges] = useState<NodeChange[]>([]);
  const onNodesChangeIntercepted = useRef(false);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const store = useStoreApi();

  useEffect(() => {
    if (!onNodesChange || onNodesChangeIntercepted.current) {
      return;
    }

    onNodesChangeIntercepted.current = true;
    const userOnNodesChange = onNodesChange;

    const onNodesChangeLogger: OnNodesChange = (changes) => {
      userOnNodesChange(changes);

      setChanges((oldChanges) => [...changes, ...oldChanges].slice(0, limit));
    };

    store.setState({ onNodesChange: onNodesChangeLogger });
  }, [onNodesChange, limit, store]);

  return (
    <div
      className="react-flow__devtools-changelogger"
      style={{ justifySelf: "flex-end" }}
    >
      <div className="react-flow__devtools-title">Change Logger</div>
      {changes.length === 0 ? (
        <>no changes triggered</>
      ) : (
        changes.map((change, index) => (
          <ChangeInfo key={index} change={change} />
        ))
      )}
    </div>
  );
}
