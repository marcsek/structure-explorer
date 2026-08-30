import "./PredicateNodeVisual.css";

export interface PredicateNodeVisualProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  constants?: string[];
  indicator?: React.ReactNode;
  error?: boolean;
  leftover?: boolean;
  ghost?: boolean;
  hatched?: boolean;
  hovered?: boolean;
  selected?: boolean;
  standalone?: boolean;
  children?: React.ReactNode;
}

export default function PredicateNodeVisual({
  label,
  constants = [],
  indicator,
  error = false,
  leftover = false,
  ghost = false,
  hatched = false,
  hovered = false,
  selected = false,
  standalone = false,
  children,
  ...props
}: PredicateNodeVisualProps) {
  const isInvalid = error || leftover;

  const body = (
    <div
      {...props}
      className={`predicate-node ${isInvalid ? "error" : ""} ${ghost ? "ghost" : ""} ${hatched ? "hatched" : ""} ${hovered ? "hovered" : ""} ${selected ? "selected" : ""} ${standalone ? "standalone" : ""} ${props.className ?? ""}`}
    >
      {!isInvalid && indicator}

      {children}

      <div className="predicate-node-body">
        <span className="predicate-node-label">{label}</span>

        {leftover ? (
          <span className="predicate-node-error-text">Leftover node</span>
        ) : (
          constants.length > 0 && (
            <span className="predicate-node-constants">
              {constants.join(", ")}
            </span>
          )
        )}
      </div>
    </div>
  );

  if (!standalone) return body;

  return <div className={`react-flow react-flow__node standalone`}>{body}</div>;
}
