import "./DomainSelector.css";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectRelevantUnaryPreds,
  selectValidatedDomain,
} from "../../structure/structureSlice";
import { type TupleInfo } from "../../structure/tupleInfo";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faFilter } from "@fortawesome/free-solid-svg-icons";
import {
  allNodesSelected,
  nodeToggled,
  selectSelectedDomain,
} from "../editorToolbarSlice";
import { selectUnaryPreds } from "../../language/languageSlice";
import { getUnaryPredicateToColorMap } from "../../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../../shared/ui/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import useClickAwayListener from "./useClickAwayListener";

export interface DomainSelectorProps {
  id: string;
  tupleInfo: TupleInfo;
  disabled: boolean;
}

export default function DomainSelector({
  id,
  tupleInfo,
  disabled,
}: DomainSelectorProps) {
  const { name, type, arity } = tupleInfo;

  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const domain = useAppSelector(selectValidatedDomain).parsed;
  const selectedNodes = useAppSelector((state) =>
    selectSelectedDomain(state, tupleInfo),
  );

  const bodyId = `domain-selector-body-${id}`;

  const onClickOutside = useCallback(() => setIsOpen(false), []);
  const clickAwayRef = useClickAwayListener<HTMLDivElement>({
    onClickOutside,
    shouldListen: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const activeFilters = domain.length !== selectedNodes.length;

  const toggleItem = useCallback(
    (element: string) =>
      dispatch(
        nodeToggled({ tupleInfo: { name, type, arity }, node: element }),
      ),
    [dispatch, name, type, arity],
  );

  const selectAll = useCallback(
    () => dispatch(allNodesSelected({ tupleInfo: { name, type, arity } })),
    [dispatch, name, type, arity],
  );

  return (
    <div
      className={`domain-selector ${activeFilters ? "active" : ""}`}
      ref={clickAwayRef}
    >
      <Button
        className={`domain-selector-toggle editor-toolbar-button ${activeFilters ? "active" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        title="Domain Filters"
        disabled={disabled}
      >
        <div className="domain-selector-toggle-icon-container">
          <div className="domain-selector-toggle-icon-indicator" />
          <FontAwesomeIcon icon={faFilter} />
        </div>
      </Button>

      {isOpen && (
        <div className="domain-selector-body" id={bodyId}>
          <div className="domain-selector-header">
            <p>Selected Elements</p>
            <button className="select-all" onClick={selectAll}>
              <FontAwesomeIcon size="sm" icon={faCheckDouble} />
              Select All
            </button>
          </div>

          <div className="domain-selector-body-divider" />

          <div className="domain-selector-list-container">
            <div className="domain-selector-list-header">
              <span>Element</span>
              <span>Unary Predicates</span>
            </div>

            {domain.length === 0 && (
              <span className="domain-selector-list-empty-text">
                No domain elements to display
              </span>
            )}

            <ul className="domain-selector-list">
              {domain.map((item) => (
                <DomainSelectorItem
                  key={item}
                  element={item}
                  isSelected={selectedNodes.includes(item)}
                  onToggle={toggleItem}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const DomainSelectorItem = memo(function DomainSelectorItem({
  element,
  isSelected,
  onToggle,
}: {
  element: string;
  isSelected: boolean;
  onToggle: (element: string) => void;
}) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds);
  const relevantPreds = useAppSelector((state) =>
    selectRelevantUnaryPreds(state, element),
  );

  const colorMap = useMemo(
    () => getUnaryPredicateToColorMap(relevantPreds, allUnaryPreds),
    [relevantPreds, allUnaryPreds],
  );

  return (
    <li>
      <button
        className={`domain-selector-item ${isSelected ? "active" : ""}`}
        onClick={() => onToggle(element)}
        tabIndex={0}
        aria-pressed={isSelected}
      >
        <span>{element}</span>

        <RelevantPredicatesIndicator predicateToColorMap={colorMap} />
      </button>
    </li>
  );
});
