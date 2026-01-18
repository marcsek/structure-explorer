import "../matrixView/TableView.css";

import { Button, Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  isValidTuple,
  selectDatabaseViewValues,
  updateDatabaseViewValue,
} from "./databaseViewSlice";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { TupleType } from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";

interface DatabaseViewProps {
  tupleName: string;
  tupleArity: number;
  tupleType: TupleType;
  locked: boolean;
}

export default function DatabaseView({
  tupleName,
  tupleArity,
  tupleType,
  locked,
}: DatabaseViewProps) {
  const dispatch = useAppDispatch();

  const { values, leftovers } = useAppSelector((state) =>
    selectDatabaseViewValues(state, tupleName, tupleType, tupleArity),
  );

  const duplicateTuples = useMemo(() => findDuplicateTuples(values), [values]);

  const lastTupleIsValid =
    tupleType !== "function" &&
    (values.length === 0 || isValidTuple(values.at(-1)!, tupleArity));

  const lastTuple = Array.from({ length: tupleArity }, () => "");

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

      newDomainTuple = [...values];
      newDomainTuple[tupleIdx] = newTuple;
    }

    dispatch(
      updateDatabaseViewValue({
        type: tupleType,
        tupleName,
        domainTuple: newDomainTuple,
        arity: correctedArity,
      }),
    );
  };

  const handleTupleDelete = (tupleIdx: number) => {
    dispatch(
      updateDatabaseViewValue({
        type: tupleType,
        tupleName,
        domainTuple: values.filter((_, idx) => idx !== tupleIdx),
        arity: correctedArity,
      }),
    );
    dispatch(UndoActions.checkpoint());
  };

  const displayTuples = lastTupleIsValid ? [...values, lastTuple] : values;
  const correctedArity = tupleType === "function" ? tupleArity + 1 : tupleArity;

  return (
    <Table responsive className="table-bordered table-view">
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
                    {isReadOnly ? (
                      <span>{tuple[idx]}</span>
                    ) : (
                      <Form.Control
                        type="text"
                        value={tuple[idx] ?? ""}
                        disabled={locked}
                        isInvalid={isLeftover || isDuplicate}
                        onChange={(e) =>
                          handleTupleChange(tupleIdx, idx, e.target.value)
                        }
                        onBlur={() => dispatch(UndoActions.checkpoint())}
                      />
                    )}
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
