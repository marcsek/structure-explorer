import "./PredicatePalettePreview.css";

import { useState } from "react";
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
  const [unselected, setUnselected] = useState<number[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const predicates = useAppSelector(selectUnaryPreds).map(([name]) => name);

  const togglePredicate = (id: number) => {
    setUnselected((p) =>
      p.includes(id) ? p.filter((pred) => pred !== id) : [...p, id],
    );
  };
  const colorsWithRepeating = [...colors];

  const predicateToColor = new Map(
    colors
      .map(
        (color, id) => [predicateName(predicates[id], id), color, id] as const,
      )
      .filter(([, , id]) => !unselected.includes(id) || hovered === id)
      .map(([pred, color]) => [pred, color]),
  );

  if (colors.length < predicates.length) {
    predicates.slice(colors.length).forEach((pred, idx) => {
      const color = colors[idx % colors.length];
      predicateToColor.set(pred, color);
      colorsWithRepeating.push(color);
    });
  }

  const nodePredicateIndicator = (
    <UnaryPredicatesIndicator
      predicateToColor={predicateToColor}
      previewed={
        hovered !== null && unselected.includes(hovered)
          ? [predicateName(predicates[hovered], hovered)]
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
        {colorsWithRepeating.map((color, id) => (
          <PredicatePill
            key={id}
            predicate={predicateName(predicates[id], id)}
            color={color}
            selected={!unselected.includes(id)}
            onChange={() => togglePredicate(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <div className="predicate-palette-preview-nodes">
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
    </div>
  );
}

function predicateName(name: string | undefined, id: number) {
  return name ?? `Pred${id + 1}`;
}
