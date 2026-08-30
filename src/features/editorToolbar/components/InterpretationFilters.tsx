import "./InterpretationFilters.css";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { Button } from "react-bootstrap";
import useScrollControls from "./useScrollControls";
import { useRef } from "react";
import useDraggingScroll from "./useDraggingScroll";
import {
  predicateHovered,
  selectSelectedUnary,
  selectUnaryFilterDomainEnabled,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
} from "../editorToolbarSlice";
import { getUnaryPredicateColor } from "../../drawerEditor/unaryPredicateColors";
import type { TupleInfo } from "../../structure/tupleInfo";
import type { EditorFilters } from "./EditorToolbar";
import { useUnhoverOnUnmount } from "../useUnhoverOnUnmount";
import { getSymbolNames, selectUnaryPreds } from "../../language/languageSlice";
import { PredicatePill } from "../../../shared/ui/PredicatePill/PredicatePill";
import { selectActivePalette } from "../../predicatePalette/predicatePaletteSlice";

export interface InterpretationFiltersProps {
  tupleInfo: TupleInfo;
  disabledFilters: EditorFilters[];
}

export default function InterpretationFilters({
  tupleInfo,
  disabledFilters,
}: InterpretationFiltersProps) {
  const dispatch = useAppDispatch();
  const unaryFilterDomain = useAppSelector((state) =>
    selectUnaryFilterDomainEnabled(state, tupleInfo),
  );
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, tupleInfo),
  );

  const unaryPredicatesCount = useAppSelector(selectUnaryPreds).length;

  const setHovered = useUnhoverOnUnmount(() =>
    dispatch(unaryFilterDomainHovered({ tupleInfo, hovered: false })),
  );

  const handleDomainHover = (hovered: boolean) => {
    setHovered(hovered);
    dispatch(unaryFilterDomainHovered({ tupleInfo, hovered }));
  };

  return (
    <div className="intr-filters-container">
      <Button
        className={`domain-button editor-toolbar-button legend-button ${!unaryFilterDomain ? "active" : ""}`}
        title="Select Domain"
        aria-pressed={unaryFilterDomain}
        onClick={() => dispatch(unaryFilterDomainToggled({ tupleInfo }))}
        onMouseEnter={() => handleDomainHover(true)}
        onMouseLeave={() => handleDomainHover(false)}
        disabled={
          selectedPredicates.length === 0 ||
          disabledFilters.includes("unaryFilterToggle")
        }
      >
        <InlineMath>{"D"}</InlineMath>
      </Button>

      <div className="intr-filters-divider" />

      {unaryPredicatesCount === 0 ? (
        <span className="intr-filter-no-elements-info">
          No unary predicates to filter
        </span>
      ) : (
        !disabledFilters.includes("intrFilters") && (
          <UnaryPredicatesFilter tupleInfo={tupleInfo} />
        )
      )}
    </div>
  );
}

interface UnaryPredicatesFilterProps {
  tupleInfo: TupleInfo;
}

function UnaryPredicatesFilter({ tupleInfo }: UnaryPredicatesFilterProps) {
  const { name: tupleName } = tupleInfo;

  const dispatch = useAppDispatch();
  const unaryPreds = getSymbolNames(useAppSelector(selectUnaryPreds));
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, tupleInfo),
  );
  const activePalette = useAppSelector(selectActivePalette);

  const predicatesExcludingSelf = unaryPreds.filter(
    (name) => name !== tupleName,
  );

  const filtersGroupRef = useRef<HTMLDivElement>(null);

  useDraggingScroll(filtersGroupRef);
  const scrollControls = useScrollControls(filtersGroupRef, { edgeMargin: 40 });

  const setHovered = useUnhoverOnUnmount(() =>
    dispatch(predicateHovered({ tupleInfo, predicates: [] })),
  );

  const handleSelectAll = () => {
    const allSelected = predicatesExcludingSelf.every((pred) =>
      selectedPredicates.includes(pred),
    );

    handlePredicateToggle(allSelected ? [] : predicatesExcludingSelf);
  };

  const handlePredicateHover = (hoveredPredicates: string[]) => {
    setHovered(hoveredPredicates.length > 0);
    dispatch(predicateHovered({ tupleInfo, predicates: hoveredPredicates }));
  };

  const handlePredicateToggle = (predicate: string | string[]) => {
    dispatch(unaryPredicateToggled({ tupleInfo, predicate }));
  };

  return (
    <div className="unary-preds-filters-wrapper">
      {scrollControls.showLeftControl && (
        <div className="scroll-button-background left">
          <button
            className="scroll-button left"
            aria-label="Scroll filters left"
            onClick={() => scrollControls.scrollIntoView("left")}
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
        </div>
      )}

      <div
        className="unary-preds-filters-group"
        ref={filtersGroupRef}
        role="group"
        aria-label="Unary predicate filters"
      >
        <Button
          className="legend-select-all editor-toolbar-button legend-button"
          title="Select all"
          onClick={handleSelectAll}
          onMouseEnter={() => handlePredicateHover(predicatesExcludingSelf)}
          onMouseLeave={() => handlePredicateHover([])}
        >
          <FontAwesomeIcon icon={faCheckDouble} />
        </Button>

        {predicatesExcludingSelf.map((predicate) => {
          const color = getUnaryPredicateColor(
            activePalette.colors,
            unaryPreds.indexOf(predicate),
          );
          const isSelected = selectedPredicates.includes(predicate);

          return (
            <PredicatePill
              key={predicate}
              predicate={predicate}
              color={color}
              selected={isSelected}
              onChange={() => handlePredicateToggle(predicate)}
              onMouseEnter={() => handlePredicateHover([predicate])}
              onMouseLeave={() => handlePredicateHover([])}
            />
          );
        })}
      </div>

      {scrollControls.showRightControl && (
        <div className="scroll-button-background right">
          <button
            className="scroll-button right"
            aria-label="Scroll filters right"
            onClick={() => scrollControls.scrollIntoView("right")}
          >
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
        </div>
      )}
    </div>
  );
}
