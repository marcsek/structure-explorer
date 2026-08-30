import { useAppSelector } from "../../../../app/hooks";
import { useGraphInfo } from "../../graphInfoContext";
import { getUnaryPredicateToColorMap } from "../../../drawerEditor/unaryPredicateColors";
import { selectPredicatesToDisplay } from "../../../editorToolbar/editorToolbarSlice";
import { selectUnaryPreds } from "../../../language/languageSlice";
import UnaryPredicatesIndicator from "./UnaryPredicatesIndicator";
import { selectActivePalette } from "../../../predicatePalette/predicatePaletteSlice";

interface NodeUnaryPredicatesIndicatorProps {
  domainId: string;
}

export default function NodeUnaryPredicatesIndicator({
  domainId,
}: NodeUnaryPredicatesIndicatorProps) {
  const { tupleInfo } = useGraphInfo();

  const activePalette = useAppSelector(selectActivePalette);
  const allUnaryPreds = useAppSelector(selectUnaryPreds);
  const [predsToDisplay, previewedPreds] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, tupleInfo, domainId),
  );

  return (
    <UnaryPredicatesIndicator
      predicateToColor={getUnaryPredicateToColorMap(
        predsToDisplay,
        allUnaryPreds,
        activePalette.colors,
      )}
      previewed={previewedPreds}
    />
  );
}
