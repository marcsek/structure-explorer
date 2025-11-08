import "./EditorToolbar.css";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  nodeToggled,
  predicateHovered,
  unaryPredicateToggled,
  selectRelevantUnaryPreds,
  selectUnaryPreds,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
} from "../../graphView/graphs/graphSlice";
import type { GraphType } from "../../graphView/graphs/plugins";
import { useEffect, useRef, useState } from "react";
import { selectParsedDomain } from "../structureSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckDouble,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { Stack } from "react-bootstrap";

export const unaryPredsColors = ["#00B8D9", "#22C55E", "#FFAB00", "#FF70A4"];

export function GraphToolbar({ id, type }: { id: string; type: GraphType }) {
  const dispatch = useAppDispatch();
  const unaryPreds = useAppSelector(selectUnaryPreds)?.sort();
  const selectedPreds = useAppSelector(
    (state) => state.graphView[id]?.selectedUnary ?? [],
  );
  const unaryFilterDomain = useAppSelector(
    (state) => state.graphView[id]?.unaryFilterDomain,
  );

  const handleSelectAll = () => {
    const allSelected = selectedPreds.length === unaryPreds.length;
    const newSelectedPreds = allSelected
      ? []
      : unaryPreds.map(([pred]) => pred);

    dispatch(unaryPredicateToggled({ id, type, predicate: newSelectedPreds }));
  };

  return (
    <div>
      {/* <p className="m-0" style={{ flexShrink: 0 }}> */}
      {/*   Interpretation Filters */}
      {/* </p> */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "1rem",
          flexShrink: 1,
          flexGrow: 0,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        {unaryPreds.length > 0 ? (
          <div className="legend-container">
            <div className="legend-toolbar">
              <button
                className={`legend-button domain-button ${!unaryFilterDomain ? "active" : ""}`}
                title="Select domain"
                onClick={() => dispatch(unaryFilterDomainToggled({ id, type }))}
                onMouseEnter={() =>
                  dispatch(
                    unaryFilterDomainHovered({ id, type, hovered: true }),
                  )
                }
                onMouseLeave={() =>
                  dispatch(
                    unaryFilterDomainHovered({ id, type, hovered: false }),
                  )
                }
              >
                <InlineMath>{String.raw`\mathcal{D}`}</InlineMath>
              </button>
              <div className="divider-legend" />
              <fieldset className="legend-group">
                <>
                  <button
                    className="legend-button legend-select-all"
                    title="Select all"
                    onClick={handleSelectAll}
                    onMouseEnter={() =>
                      dispatch(
                        predicateHovered({
                          id,
                          type,
                          predicates: unaryPreds.map((p) => p[0]),
                        }),
                      )
                    }
                    onMouseLeave={() =>
                      dispatch(predicateHovered({ id, type, predicates: [] }))
                    }
                  >
                    <FontAwesomeIcon icon={faCheckDouble} />
                  </button>
                  {unaryPreds.map(([pred], idx) => (
                    <label
                      key={pred}
                      className="chip"
                      style={{
                        color: unaryPredsColors[idx % unaryPredsColors.length],
                      }}
                      onMouseEnter={() =>
                        dispatch(
                          predicateHovered({ id, type, predicates: [pred] }),
                        )
                      }
                      onMouseLeave={() =>
                        dispatch(predicateHovered({ id, type, predicates: [] }))
                      }
                    >
                      <input
                        type="checkbox"
                        name="unary preds"
                        checked={selectedPreds.includes(pred)}
                        onChange={() =>
                          dispatch(
                            unaryPredicateToggled({
                              id,
                              type,
                              predicate: pred,
                            }),
                          )
                        }
                      />
                      <span
                        className="dot"
                        style={{
                          color:
                            unaryPredsColors[idx % unaryPredsColors.length],
                        }}
                      >
                        {selectedPreds.includes(pred) && (
                          <FontAwesomeIcon icon={faCheck} />
                        )}
                      </span>
                      <p
                        style={{
                          color: selectedPreds.includes(pred)
                            ? unaryPredsColors[idx % unaryPredsColors.length]
                            : "",
                        }}
                      >
                        {pred}
                      </p>
                    </label>
                  ))}
                </>
              </fieldset>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0 }}>No unary predicates</p>
        )}
        <DomainElementsSelector id={id} type={type} />
      </div>
    </div>
  );
}

export function DomainElementsSelector({
  id,
  type,
}: {
  id: string;
  type: GraphType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const domain = useAppSelector(selectParsedDomain)?.parsed ?? [];
  const selectedNodes = useAppSelector(
    (state) => state.graphView[id]?.selectedNodes,
  );

  const activeFilters = domain.length !== selectedNodes.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    } else {
      document.removeEventListener("pointerdown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleItem = (element: string = "") =>
    dispatch(nodeToggled({ id, type, node: element }));

  return (
    <div
      className={`domain-elements ${activeFilters ? "active" : ""}`}
      ref={ref}
    >
      <button
        className="domain-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Domain filters"
      >
        <div className="domain-filter-icon-container">
          <div className="domain-filter-indicator" />
          <FontAwesomeIcon icon={faFilter} />
        </div>
      </button>

      {isOpen && (
        <div className="domain-body">
          <div className="body-header">
            <p>Selected Elements</p>
            <button className="select-all" onClick={() => toggleItem()}>
              <FontAwesomeIcon icon={faCheckDouble} />
              Select All
            </button>
          </div>

          <div className="divider" />
          <div className="element-list-container">
            <div className="select-head">
              <span>Element</span>
              <span>Unary Predicates</span>
            </div>
            <ul className="element-list">
              {domain.map((item) => (
                <DomainElementItem
                  key={item}
                  element={item}
                  isSelected={selectedNodes.includes(item)}
                  onToggle={() => toggleItem(item)}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainElementItem({
  element,
  isSelected,
  onToggle,
}: {
  element: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds)?.sort();
  const relevantPreds = useAppSelector((state) =>
    selectRelevantUnaryPreds(state, element),
  )?.sort();

  return (
    <li key={element}>
      <button
        className={`element-item ${isSelected ? "active" : ""}`}
        onClick={onToggle}
        tabIndex={0}
        aria-pressed={isSelected}
      >
        {element}
        <div className="relevant-preds-list">
          {relevantPreds.map((pred) => (
            <span
              key={pred}
              style={{
                backgroundColor:
                  unaryPredsColors[
                    allUnaryPreds.findIndex((p) => p[0] === pred) %
                      unaryPredsColors.length
                  ],
              }}
              className="relevant-pred"
            />
          ))}
        </div>
      </button>
    </li>
  );
}
