import "./PredicatePalettePreview.css";

import { useState } from "react";
import { Background, ReactFlowProvider } from "@xyflow/react";
import { useInstanceId } from "../../../providers/instanceIdContext";
import { PredicatePill } from "../../../shared/ui/PredicatePill/PredicatePill";
import PredicateNodeVisual from "../../graphView/canvas/nodes/PredicateNodeVisual";
import UnaryPredicatesIndicator from "../../graphView/canvas/nodes/UnaryPredicatesIndicator";
import PaletteTitle from "./PaletteTitle";
import { useAppSelector } from "../../../app/hooks";
import { selectUnaryPreds } from "../../language/languageSlice";

interface PredicatePalettePreviewProps {
  colors: string[];
}

export default function PredicatePalettePreview({
  colors,
}: PredicatePalettePreviewProps) {
  const instanceId = useInstanceId();
  const [unselected, setUnselected] = useState<number[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const predicates = useAppSelector(selectUnaryPreds).map(([name]) => name);

  const togglePredicate = (id: number) => {
    setUnselected((p) =>
      p.includes(id) ? p.filter((pred) => pred !== id) : [...p, id],
    );
  };

  const pills = Array.from(
    { length: Math.max(colors.length, predicates.length) },
    (_, id) => ({
      id,
      predicate: predicateName(predicates[id], id),
      color: colors[id % colors.length],
    }),
  );

  const predicateToColor = new Map(
    pills
      .filter(({ id }) => !unselected.includes(id) || hovered === id)
      .map(({ predicate, color }) => [predicate, color]),
  );

  const nodePredicateIndicator = (
    <UnaryPredicatesIndicator
      predicateToColor={predicateToColor}
      previewed={
        hovered !== null && unselected.includes(hovered)
          ? [pills[hovered].predicate]
          : undefined
      }
    />
  );

  return (
    <div className="predicate-palette-preview">
      <PaletteTitle
        title="Preview"
        subtitle="Toggle predicates to preview how the colors combine."
      />

      <div className="predicate-palette-preview-pills">
        {pills.map(({ id, predicate, color }) => (
          <PredicatePill
            key={id}
            predicate={predicate}
            color={color}
            selected={!unselected.includes(id)}
            onChange={() => togglePredicate(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <ReactFlowProvider>
        <div className="react-flow predicate-palette-preview-nodes">
          <Background id={`bg-${instanceId}-predicate-palette-preview`} />
          <PredicateNodeVisual
            label="A"
            constants={["Mark"]}
            indicator={nodePredicateIndicator}
            standalone
          />

          <PredicateNodeVisual
            label="A"
            constants={["Mark"]}
            indicator={nodePredicateIndicator}
            standalone
            ghost
            hovered
          />
        </div>
      </ReactFlowProvider>
    </div>
  );
}

function predicateName(name: string | undefined, id: number) {
  return name ?? `Pred${id + 1}`;
}
