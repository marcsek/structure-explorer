import { useAppSelector } from "../../app/hooks";
import { selectPredicatesToDisplay } from "../editorToolbar/editorToolbarSlice";
import { selectUnaryPreds } from "../language/languageSlice";
import { getUnaryPredicateToColorMap } from "./unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../shared/ui/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import type { TupleInfo } from "../structure/tupleInfo";

interface DomainPredicateIndicatorProps {
  tupleInfo: TupleInfo;
  domainId: string;
  showEmpty?: boolean;
}

export function DomainPredicateIndicator({
  tupleInfo,
  domainId,
  showEmpty = false,
}: DomainPredicateIndicatorProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds);

  const [predsToDisplay, previewed] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, tupleInfo, domainId),
  );

  if (!showEmpty && predsToDisplay.length === 0 && previewed.length === 0)
    return null;

  const colorMap = getUnaryPredicateToColorMap(
    predsToDisplay ?? [],
    allUnaryPreds ?? [],
  );

  return (
    <RelevantPredicatesIndicator
      predicateToColorMap={colorMap}
      previewed={previewed}
      size="sm"
    />
  );
}
