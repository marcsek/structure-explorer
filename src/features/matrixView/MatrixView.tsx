import "./TableView.css";

import { Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useState } from "react";
import { selectUnaryPreds } from "../graphView/graphs/graphSlice";
import {
  selectFilteredDomain,
  selectPredicatesToDisplay,
} from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../components_helper/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import {
  generateTupleInterpretation,
  getKeyFromDomainTuple,
  selectMatrixValuesWithInvalid,
  updaters,
} from "./matrixViewSelectors";
import type { TupleType } from "../structure/structureSlice";
import { FunctionTableCell, PredicateTableCell } from "./MatrixViewCells";
import { UndoActions } from "../undoHistory/undoHistory";
import EmptyPlaceholder from "../../components_helper/EmptyPlaceholder/EmptyPlaceholder";

interface MatrixViewProps {
  tupleName: string;
  tupleArity: number;
  tupleType: TupleType;
  locked: boolean;
}

export default function MatrixView({
  tupleName,
  tupleArity,
  tupleType,
  locked,
}: MatrixViewProps) {
  const [hovered, setHovered] = useState({ row: "", col: "" });

  const dispatch = useAppDispatch();

  const { values, leftovers } = useAppSelector((state) =>
    selectMatrixValuesWithInvalid(state, tupleName, tupleType),
  );

  const domain = useAppSelector((state) =>
    selectFilteredDomain(state, tupleName, true),
  );

  const isUnary = tupleArity === 1;
  const getDomainTuple = (row: string, col: string) =>
    isUnary ? [row] : [row, col];

  const getEntry = (row: string, col: string) =>
    values[getKeyFromDomainTuple(getDomainTuple(row, col))];

  const getValue = (row: string, col: string) => getEntry(row, col)?.value;

  const isDuplicate = (row: string, col: string) =>
    getEntry(row, col)?.duplicate;

  const isInvalid = (row: string, col: string) =>
    leftovers.includes(col) ||
    leftovers.includes(row) ||
    !!isDuplicate(row, col);

  const handleValueChange = (row: string, col: string, value: string) => {
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

  const domainWithLeftovers = [...domain, ...leftovers].sort();

  const getTableClass = (element: string, hovered: string) => {
    if (leftovers.includes(element)) return "error";
    if (hovered === element) return "hovered";
    return "";
  };

  if (domainWithLeftovers.length === 0) {
    return (
      <EmptyPlaceholder
        message={"No content to display (selected domain is empty)"}
      />
    );
  }

  return (
    <Table responsive className="table-bordered table-view">
      <thead>
        <tr>
          <th key="col-head">Domain</th>
          {!isUnary &&
            domainWithLeftovers.map((head) => (
              <th className={getTableClass(head, hovered.col)} key={head}>
                <PredicateIndicatorTableHead
                  predicateName={tupleName}
                  domainId={head}
                />
              </th>
            ))}
        </tr>
      </thead>

      <tbody>
        {domainWithLeftovers.map((row) => (
          <tr key={`r-${row}`} className={getTableClass(row, hovered.row)}>
            <td key="row-head">
              <PredicateIndicatorTableHead
                predicateName={tupleName}
                domainId={row}
              />
            </td>

            {(isUnary ? [row] : domainWithLeftovers).map((col) =>
              tupleType === "predicate" ? (
                <PredicateTableCell
                  key={col}
                  value={!!getValue(row, col)}
                  onValueChange={() => {
                    handleValueChange(row, col, getValue(row, col) ? "" : "in");
                    dispatch(UndoActions.checkpoint());
                  }}
                  locked={locked}
                  hovered={hovered.col === col}
                  columnError={leftovers.includes(col)}
                  invalid={isInvalid(row, col)}
                  onHovered={(hovered) =>
                    setHovered(hovered ? { row, col } : { row: "", col: "" })
                  }
                />
              ) : (
                <FunctionTableCell
                  key={col}
                  value={getValue(row, col) ?? ""}
                  columnError={leftovers.includes(col)}
                  invalid={
                    (getValue(row, col) &&
                      !domain.includes(getValue(row, col))) ||
                    isInvalid(row, col)
                  }
                  onValueChange={(value) => handleValueChange(row, col, value)}
                  locked={locked}
                  onBlur={() => dispatch(UndoActions.checkpoint())}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

interface PredicateIndicatorTableHeadProps {
  predicateName: string;
  domainId: string;
}

function PredicateIndicatorTableHead({
  predicateName,
  domainId,
}: PredicateIndicatorTableHeadProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds)?.sort();

  const [predsToDisplay] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, predicateName, domainId),
  );

  const colorMap = getUnaryPredicateToColorMap(
    predsToDisplay ?? [],
    allUnaryPreds ?? [],
  );

  return (
    <div className="table-view-head">
      {domainId}
      <RelevantPredicatesIndicator predicateToColorMap={colorMap} size="sm" />
    </div>
  );
}
