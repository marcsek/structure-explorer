import "./RelevantPredicatesIndicator.css";

interface RelevantPredicatesIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  predicateToColorMap: Map<string, string>;
  previewed?: string[];
  size?: "md" | "sm";
}

export function RelevantPredicatesIndicator({
  predicateToColorMap,
  size = "md",
  previewed = [],
  ...props
}: RelevantPredicatesIndicatorProps) {
  return (
    <div
      className={`relevant-pred-indicator size-${size} ${props.className}`}
      {...props}
    >
      {[...predicateToColorMap.entries()].map(([pred, color]) => (
        <span
          key={pred}
          style={{ color }}
          className={`relevant-pred-indicator-pred ${previewed.includes(pred) ? "previewed" : ""}`}
        />
      ))}
    </div>
  );
}
