import "./InterpretationFilters.css";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectUnaryPreds } from "../../graphView/graphs/graphSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faCheck,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { Button } from "react-bootstrap";
import useScrollControls from "./useScrollControls";
import { useRef } from "react";
import useDraggingScroll from "./useDragginScroll";
import {
  predicateHovered,
  selectSelectedUnary,
  selectUnaryFilterDomain,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
} from "../../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateColor } from "../../drawerEditor/unaryPredicateColors";

export interface InterpretationFiltersProps {
  id: string;
}

export default function InterpretationFilters({
  id,
}: InterpretationFiltersProps) {
  const dispatch = useAppDispatch();
  const unaryFilterDomain = useAppSelector((state) =>
    selectUnaryFilterDomain(state, id),
  );
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, id),
  );

  const unaryPredicatesCount = useAppSelector(selectUnaryPreds)?.length ?? 0;

  const handleDomainHover = (hovered: boolean) => {
    dispatch(unaryFilterDomainHovered({ id, hovered }));
  };

  return (
    <div className="intr-filters-container">
      <Button
        className={`domain-button editor-toolbar-button legend-button  ${!unaryFilterDomain ? "active" : ""}`}
        title="Select Domain"
        onClick={() => dispatch(unaryFilterDomainToggled({ id }))}
        onMouseEnter={() => handleDomainHover(true)}
        onMouseLeave={() => handleDomainHover(false)}
        disabled={selectedPredicates.length === 0}
      >
        <InlineMath>{String.raw`\mathcal{D}`}</InlineMath>
      </Button>

      <div className="intr-filters-divider" />

      {unaryPredicatesCount !== 0 ? (
        <UnaryPredicatesFilter id={id} />
      ) : (
        <span className="intr-filter-no-elements-info">
          No unary predicates to filter
        </span>
      )}
    </div>
  );
}

interface UnaryPredicatesFilterProps {
  id: string;
}

function UnaryPredicatesFilter({ id }: UnaryPredicatesFilterProps) {
  const dispatch = useAppDispatch();
  const predicates = useAppSelector(selectUnaryPreds)?.map(([name]) => name);
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, id),
  );
  const predicatesExcludingSelf = predicates.filter((name) => name !== id);

  const filtersGroupRef = useRef<HTMLFieldSetElement>(null);

  useDraggingScroll(filtersGroupRef);
  const scrollControls = useScrollControls(filtersGroupRef, { edgeMargin: 40 });

  const handleSelectAll = () => {
    const allSelected =
      selectedPredicates.length === predicatesExcludingSelf.length;
    const newSelectedPredicates = allSelected
      ? []
      : predicatesExcludingSelf.map((pred) => pred);

    handlePredicateToggle(newSelectedPredicates);
  };

  const handlePredicateHover = (hoveredPredicates: string[]) => {
    dispatch(predicateHovered({ id, predicates: hoveredPredicates }));
  };

  const handlePredicateToggle = (predicate: string | string[]) => {
    dispatch(unaryPredicateToggled({ id, predicate }));
  };

  return (
    <div className="unary-preds-filters-wrapper">
      {scrollControls.showLeftControl && (
        <div className="scroll-button-background left">
          <button
            className="scroll-button left"
            onClick={() => scrollControls.scrollIntoView("left")}
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
        </div>
      )}

      <fieldset className="unary-preds-filters-group" ref={filtersGroupRef}>
        <Button
          className="legend-select-all editor-toolbar-button legend-button"
          title="Select all"
          onClick={handleSelectAll}
          onMouseEnter={() => handlePredicateHover(predicatesExcludingSelf)}
          onMouseLeave={() => handlePredicateHover([])}
        >
          <FontAwesomeIcon icon={faCheckDouble} />
        </Button>

        {predicatesExcludingSelf.map((predicate) => (
          <label
            key={predicate}
            className="unary-preds-filters-checkbox"
            style={{
              color: getUnaryPredicateColor(predicates.indexOf(predicate)),
            }}
            onMouseEnter={() => handlePredicateHover([predicate])}
            onMouseLeave={() => handlePredicateHover([])}
          >
            <input
              type="checkbox"
              name="unary preds"
              checked={selectedPredicates.includes(predicate)}
              onChange={() => handlePredicateToggle(predicate)}
            />
            <span
              className="unary-preds-filters-checkbox-indicator"
              style={{
                color: getUnaryPredicateColor(predicates.indexOf(predicate)),
              }}
            >
              {selectedPredicates.includes(predicate) && (
                <FontAwesomeIcon icon={faCheck} />
              )}
            </span>
            <p
              style={{
                color: selectedPredicates.includes(predicate)
                  ? getUnaryPredicateColor(predicates.indexOf(predicate))
                  : "",
              }}
            >
              {predicate}
            </p>
          </label>
        ))}
      </fieldset>

      {scrollControls.showRightControl && (
        <div className="scroll-button-background right">
          <button
            className="scroll-button right"
            onClick={() => scrollControls.scrollIntoView("right")}
          >
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
        </div>
      )}
    </div>
  );
}
