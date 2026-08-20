import "./graphComponents.css";

import { useAppSelector } from "../../../../app/hooks";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { getUnaryPredicateToColorMap } from "../../../drawerEditor/unaryPredicateColors";
import {
  selectPredicatesToDisplay,
  selectUnaryPreds,
} from "../../../editorToolbar/editorToolbarSlice";

interface UnaryPredicatesIndicatorProps {
  domainId: string;
}

export default function UnaryPredicatesIndicator({
  domainId,
}: UnaryPredicatesIndicatorProps) {
  const { tupleInfo } = useGraphInfo();

  const allUnaryPreds = useAppSelector(selectUnaryPreds);
  const [predsToDisplay, previewedPreds] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, tupleInfo, domainId),
  );

  const predicateToColor = getUnaryPredicateToColorMap(
    predsToDisplay,
    allUnaryPreds,
  );

  return (
    <div className="predicate-node-indicator">
      <div className="predicate-node-indicator-stripy-overlay" />
      {[...predicateToColor].map(([pred, color]) => (
        <div
          key={pred}
          style={{ color }}
          className={`predicate-node-indicator-item ${previewedPreds.includes(pred) ? "stripy" : ""}`}
        />
      ))}
    </div>
  );
}
