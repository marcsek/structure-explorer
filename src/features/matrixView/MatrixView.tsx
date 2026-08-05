import "./TableView.css";

import { Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectUnaryPreds } from "../graphView/graphs/graphSlice";
import {
  selectFilteredDomain,
  selectHatchedDomain,
  selectPredicatesToDisplay,
} from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../shared/ui/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import {
  generateTupleInterpretation,
  getKeyFromDomainTuple,
  selectMatrixValuesWithInvalid,
  updaters,
} from "./matrixViewSelectors";
import { selectDomain } from "../structure/structureSlice";
import { FunctionTableCell, PredicateTableCell } from "./MatrixViewCells";
import { UndoActions } from "../undoHistory/undoHistory";
import EmptyPlaceholder from "../../shared/ui/EmptyPlaceholder/EmptyPlaceholder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownLong,
  faArrowRightLong,
} from "@fortawesome/free-solid-svg-icons";
import useTableCrosshairHover from "./useTableCrosshairHover";
import type { TupleInfo } from "../structure/tupleInfo";

interface MatrixViewProps {
  tupleInfo: TupleInfo;
  locked: boolean;
}

export default function MatrixView({ tupleInfo, locked }: MatrixViewProps) {
  const { type: tupleType, name: tupleName, arity: tupleArity } = tupleInfo;

  const dispatch = useAppDispatch();
  const { tableRef, handleCellHover } = useTableCrosshairHover();
  const { values, leftovers } = useAppSelector((state) =>
    selectMatrixValuesWithInvalid(state, tupleInfo),
  );
  const domain = useAppSelector(selectDomain).value;
  const selectedDomain = useAppSelector((state) =>
    selectFilteredDomain(state, tupleInfo, true),
  );
  const hatchedDomain = useAppSelector((state) =>
    selectHatchedDomain(state, tupleInfo),
  );

  const isUnary = tupleArity === 1;
  const getDomainTuple = (row: string, col: string) =>
    isUnary ? [col] : [row, col];

  const getEntry = (row: string, col: string) =>
    values[getKeyFromDomainTuple(getDomainTuple(row, col))];

  const getValue = (row: string, col: string) => getEntry(row, col)?.value;

  const isDuplicate = (row: string, col: string) =>
    getEntry(row, col)?.duplicate;

  const isInvalid = (row: string, col: string) =>
    leftovers.includes(col) ||
    leftovers.includes(row) ||
    !!isDuplicate(row, col);

  const updateValue = (row: string, col: string, value: string) => {
    if (locked) return;

    const domainTuple = getDomainTuple(row, col);
    const key = getKeyFromDomainTuple(domainTuple);
    const newValues = { ...values };

    const hasDuplicate = newValues[key]?.duplicate;
    newValues[key] = {
      ...(newValues[key] ?? { duplicate: false, domainTuple }),
      value,
    };

    if (hasDuplicate) {
      const duplicateKey = getKeyFromDomainTuple(domainTuple, true);
      newValues[duplicateKey] = { ...newValues[duplicateKey], value };
    }

    const newInterpretation = generateTupleInterpretation(tupleType, newValues);

    dispatch(updaters[tupleType]({ value: newInterpretation, key: tupleName }));

    const isInsideLeftover = domainTuple.some((d) => leftovers.includes(d));
    const willBeResolvedInvalid =
      (isInsideLeftover || isDuplicate(row, col)) && value === "";

    if (tupleType === "function" && willBeResolvedInvalid)
      dispatch(UndoActions.checkpoint());
  };

  const handlePredicateToggle = (row: string, col: string) => {
    updateValue(row, col, getValue(row, col) ? "" : "in");
    dispatch(UndoActions.checkpoint());
  };

  const handleFunctionChange = (row: string, col: string, value: string) => {
    updateValue(row, col, value);
  };

  const getCellState = (row: string, col: string) => {
    const value = getValue(row, col) ?? "";
    const columnError = leftovers.includes(col);
    const unselected =
      unselectedDomain.includes(col) || unselectedDomain.includes(row);
    const hatched = hatchedDomain.includes(col) || hatchedDomain.includes(row);
    const invalid =
      (tupleType === "function" && !!value && !domain.includes(value)) ||
      isInvalid(row, col);

    return { value, columnError, unselected, hatched, invalid };
  };

  const selectedDomainWithHatched = domain.filter(
    (e) => selectedDomain.includes(e) || hatchedDomain.includes(e),
  );
  const unselectedDomain = domain.filter(
    (e) => !selectedDomainWithHatched.includes(e) && !leftovers.includes(e),
  );
  const domainWithLeftovers = [
    ...selectedDomainWithHatched,
    ...leftovers,
    ...unselectedDomain,
  ];

  const getTableClass = (element: string) => {
    const unselected = unselectedDomain.includes(element) ? " unselected" : "";
    if (leftovers.includes(element) && !unselected) return "error";
    if (hatchedDomain.includes(element)) return "hatched";
    return unselected;
  };

  const domainWithoutUnselected = [...selectedDomainWithHatched, ...leftovers];
  if (domainWithoutUnselected.length === 0) {
    return (
      <EmptyPlaceholder message="Nothing to display (selected domain is empty)" />
    );
  }

  return (
    <Table
      responsive
      className="table-bordered table-view"
      size="sm"
      ref={tableRef}
    >
      <thead>
        <tr>
          <TableHeadsIndicator key="col-head" headCount={tupleArity} />
          {domainWithLeftovers.map((head) => (
            <th className={getTableClass(head)} key={head}>
              <PredicateIndicatorTableHead
                tupleInfo={tupleInfo}
                domainId={head}
              />
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {(isUnary ? [""] : domainWithLeftovers).map((row, rowIdx) => (
          <tr key={`r-${row}`} className={getTableClass(row)}>
            <td key="row-head">
              {!isUnary && (
                <PredicateIndicatorTableHead
                  tupleInfo={tupleInfo}
                  domainId={row}
                />
              )}
            </td>

            {domainWithLeftovers.map((col, colIdx) => {
              const cellState = getCellState(row, col);

              if (tupleType === "predicate") {
                return (
                  <PredicateTableCell
                    key={col}
                    {...cellState}
                    value={!!cellState.value}
                    onValueChange={() => handlePredicateToggle(row, col)}
                    locked={locked}
                    onMouseEnter={() =>
                      handleCellHover(isUnary ? -1 : rowIdx, colIdx)
                    }
                    onMouseLeave={() => handleCellHover(-1, -1)}
                  />
                );
              }

              return (
                <FunctionTableCell
                  key={col}
                  {...cellState}
                  onValueChange={(value) =>
                    handleFunctionChange(row, col, value)
                  }
                  locked={locked}
                  onBlur={() => dispatch(UndoActions.checkpoint())}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

interface PredicateIndicatorTableHeadProps {
  tupleInfo: TupleInfo;
  domainId: string;
}

function PredicateIndicatorTableHead({
  tupleInfo,
  domainId,
}: PredicateIndicatorTableHeadProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds);
  const [predsToDisplay, previewed] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, tupleInfo, domainId),
  );

  const colorMap = getUnaryPredicateToColorMap(
    predsToDisplay ?? [],
    allUnaryPreds ?? [],
  );

  return (
    <div className="table-view-head">
      {domainId}
      <RelevantPredicatesIndicator
        predicateToColorMap={colorMap}
        previewed={previewed}
        size="sm"
      />
    </div>
  );
}

interface TableHeadsIndicatorProps {
  headCount: number;
}

function TableHeadsIndicator({ headCount }: TableHeadsIndicatorProps) {
  return (
    <th className="table-heads-indicator">
      <div className="table-heads-indicator-item down">
        {headCount > 1 && (
          <>
            <span>(</span>
            <FontAwesomeIcon icon={faArrowDownLong} />
          </>
        )}
        <span>
          <var>m</var>
          <sub>1</sub>
        </span>
      </div>
      {headCount > 1 && (
        <>
          <span>,</span>
          <div className="table-heads-indicator-item right">
            <FontAwesomeIcon icon={faArrowRightLong} />
            <span>
              <var>m</var>
              <sub>2</sub>
            </span>
          </div>
          <span>)</span>
        </>
      )}
    </th>
  );
}
