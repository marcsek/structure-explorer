import "../matrixView/TableView.css";

import { Button, Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  isValidTuple,
  selectDatabaseViewValues,
  updateDatabaseViewValue,
} from "./databaseViewSlice";
import { useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { selectDomain } from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import EmptyPlaceholder from "../../shared/ui/EmptyPlaceholder/EmptyPlaceholder";
import { selectUnaryPreds } from "../graphView/graphs/graphSlice";
import { selectPredicatesToDisplay } from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../shared/ui/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import type { TupleInfo } from "../structure/tupleInfo";

interface DatabaseViewProps {
  tupleInfo: TupleInfo;
  locked: boolean;
}

export default function DatabaseView({ tupleInfo, locked }: DatabaseViewProps) {
  const { type: tupleType, arity: tupleArity } = tupleInfo;

  const dispatch = useAppDispatch();
  const checkpointOnBlurOverride = useRef<boolean | null>(null);

  const { values, leftovers } = useAppSelector((state) =>
    selectDatabaseViewValues(state, tupleInfo),
  );
  const { value: domain } = useAppSelector(selectDomain);

  const duplicateTuples = useMemo(() => findDuplicateTuples(values), [values]);

  const lastTupleIsValid =
    tupleType !== "function" &&
    (values.length === 0 || isValidTuple(values.at(-1)!, tupleArity));

  const lastTuple = Array.from({ length: tupleArity }, () => "");
  const correctedArity = tupleType === "function" ? tupleArity + 1 : tupleArity;
  const correctedTupleId = { ...tupleInfo, arity: correctedArity };

  const handleTupleChange = (
    tupleIdx: number,
    elementIdx: number,
    value: string,
  ) => {
    let newDomainTuple: string[][] = [];

    if (lastTupleIsValid && tupleIdx === values.length) {
      lastTuple[elementIdx] = value;
      newDomainTuple = [...values, lastTuple];
    } else {
      const newTuple = [...values[tupleIdx]];
      newTuple[elementIdx] = value;

      if (countEmpty(newTuple) === 1 && countEmpty(values[tupleIdx]) === 0)
        checkpointOnBlurOverride.current = true;
      else if (newTuple.every((e) => e === ""))
        checkpointOnBlurOverride.current = false;

      newDomainTuple = [...values];
      newDomainTuple[tupleIdx] = newTuple;
    }

    dispatch(
      updateDatabaseViewValue({
        tupleInfo: correctedTupleId,
        domainTuple: newDomainTuple,
      }),
    );
  };

  const handleTupleDelete = (tupleIdx: number) => {
    dispatch(
      updateDatabaseViewValue({
        tupleInfo: correctedTupleId,
        domainTuple: values.filter((_, idx) => idx !== tupleIdx),
      }),
    );

    if (values[tupleIdx].every((e) => e !== ""))
      dispatch(UndoActions.checkpoint());
  };

  const handleCheckpointOnBlur = (tupleIdx: number) => {
    if (tupleType === "function") {
      dispatch(UndoActions.checkpoint());
      return;
    }

    if (checkpointOnBlurOverride.current !== null) {
      if (checkpointOnBlurOverride.current) dispatch(UndoActions.checkpoint());

      checkpointOnBlurOverride.current = null;
      return;
    }

    if (isValidTuple(displayTuples[tupleIdx], tupleArity))
      dispatch(UndoActions.checkpoint());
  };

  const displayTuples = lastTupleIsValid ? [...values, lastTuple] : values;

  if (domain.length === 0 && values.length === 0) {
    return <EmptyPlaceholder message="Nothing to display (domain is empty)" />;
  }

  return (
    <Table responsive className="table-bordered table-view" size="sm">
      <thead>
        <tr>
          {Array.from({ length: correctedArity }, (_, idx) => (
            <th key={`head-${idx}`}>
              <var>m</var>
              <sub>{idx + 1}</sub>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {displayTuples.map((tuple, tupleIdx) => {
          const isDuplicate = duplicateTuples.has(tuple.join(","));
          const isLast = tupleIdx === displayTuples.length - 1;
          const canDelete = !locked && !isLast && tupleType === "predicate";

          return (
            <tr key={`row-${tupleIdx}`} className={isDuplicate ? "error" : ""}>
              {Array.from({ length: correctedArity }, (_, idx) => {
                const isLeftover = leftovers.includes(tuple[idx]);
                const isReadOnly =
                  tupleType === "function" && idx !== correctedArity - 1;

                return (
                  <td key={`col-${idx}`} className={isLeftover ? "error" : ""}>
                    <div className="table-view-data-indicator">
                      {isReadOnly ? (
                        <span>{tuple[idx]}</span>
                      ) : (
                        <Form.Control
                          type="text"
                          size="sm"
                          value={tuple[idx] ?? ""}
                          disabled={locked}
                          isInvalid={isLeftover || isDuplicate}
                          onChange={(e) =>
                            handleTupleChange(tupleIdx, idx, e.target.value)
                          }
                          onBlur={() => handleCheckpointOnBlur(tupleIdx)}
                        />
                      )}
                      {(!isLast || tupleType === "function") && (
                        <PredicateIndicatorTableData
                          tupleInfo={tupleInfo}
                          domainId={tuple[idx]}
                        />
                      )}
                    </div>
                  </td>
                );
              })}

              {canDelete && (
                <DeleteTupleTableEntry
                  isDuplicate={isDuplicate}
                  key={`lock-${tupleIdx}`}
                  onDelete={() => handleTupleDelete(tupleIdx)}
                />
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

const findDuplicateTuples = (tuples: string[][]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const tuple of tuples) {
    if (tuple.includes("")) continue;

    const key = tuple.join(",");

    if (seen.has(key)) duplicates.add(key);
    else seen.add(key);
  }

  return duplicates;
};

const countEmpty = (tuple: string[]) => tuple.filter((t) => t === "").length;

interface PredicateIndicatorTableDataProps {
  tupleInfo: TupleInfo;
  domainId: string;
}

function PredicateIndicatorTableData({
  tupleInfo,
  domainId,
}: PredicateIndicatorTableDataProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds);

  const [predsToDisplay, previewed] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, tupleInfo, domainId),
  );

  const colorMap = getUnaryPredicateToColorMap(
    predsToDisplay ?? [],
    allUnaryPreds ?? [],
  );

  if (predsToDisplay.length === 0 && previewed.length === 0) return null;

  return (
    <RelevantPredicatesIndicator
      predicateToColorMap={colorMap}
      previewed={previewed}
      size="sm"
    />
  );
}

interface DeleteTupleTableEntryProps {
  isDuplicate: boolean;
  onDelete: () => void;
}

function DeleteTupleTableEntry({
  isDuplicate,
  onDelete,
}: DeleteTupleTableEntryProps) {
  return (
    <td className="align-middle">
      <Button
        size="sm"
        className={!isDuplicate ? "btn-bd-light" : "btn-danger"}
        onClick={onDelete}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </td>
  );
}
