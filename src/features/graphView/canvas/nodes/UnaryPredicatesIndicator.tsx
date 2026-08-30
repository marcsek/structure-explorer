import "./UnaryPredicatesIndicator.css";

interface UnaryPredicatesIndicatorProps {
  predicateToColor: Map<string, string>;
  previewed?: string[];
}

export default function UnaryPredicatesIndicator({
  predicateToColor,
  previewed = [],
}: UnaryPredicatesIndicatorProps) {
  return (
    <div className="predicate-node-indicator">
      <div className="predicate-node-indicator-stripy-overlay" />
      {[...predicateToColor].map(([pred, color]) => (
        <div
          key={pred}
          style={{ color }}
          className={`predicate-node-indicator-item ${previewed.includes(pred) ? "stripy" : ""}`}
        />
      ))}
    </div>
  );
}
