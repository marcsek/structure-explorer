import "../matrixView/MatrixView.css";

import { Button, Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  isValidTuple,
  selectDatabaseViewLeftovers,
  selectDatabaseViewValues,
  updateDatabaseViewValue,
} from "./databaseViewSlice";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

interface DatabaseViewProps {
  tupleName: string;
  tupleArity: number;
  tupleType: "predicate" | "function";
  locked: boolean;
  expandedView?: boolean;
  error?: string;
}

export default function DatabaseView({
  tupleName,
  tupleArity,
  tupleType,
  error,
  locked,
}: DatabaseViewProps) {
  const dispatch = useAppDispatch();

  const tuples = useAppSelector((state) =>
    selectDatabaseViewValues(state, tupleName, tupleType, tupleArity),
  );

  const leftoverDomain = useAppSelector((state) =>
    selectDatabaseViewLeftovers(state, tupleName, tupleType),
  );

  const duplicateTuples = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const tuple of tuples) {
      if (tuple.includes("")) continue;

      const key = tuple.join(",");

      if (seen.has(key)) duplicates.add(key);
      else seen.add(key);
    }

    return duplicates;
  }, [tuples]);

  const handleTupleChange = (
    tupleIdx: number,
    elementIdx: number,
    value: string,
  ) => {
    if (lastTupleIsValid && tupleIdx === tuples.length)
      return handleLastTupleChange(elementIdx, value);

    const newTuple = [...tuples[tupleIdx]];
    newTuple[elementIdx] = value;

    const newDomainTuple = [...tuples];
    newDomainTuple[tupleIdx] = newTuple;

    dispatch(
      updateDatabaseViewValue({
        type: tupleType,
        tupleName,
        domainTuple: newDomainTuple,
      }),
    );
  };

  const handleTupleDelete = (tupleIdx: number) => {
    dispatch(
      updateDatabaseViewValue({
        type: tupleType,
        tupleName,
        domainTuple: tuples.filter((_, idx) => idx !== tupleIdx),
      }),
    );
  };

  const lastTupleIsValid =
    tupleType !== "function" &&
    (isValidTuple(tuples.at(-1) ?? [], tupleArity) || tuples.length === 0);

  const lastTuple = Array.from({ length: tupleArity }, () => "");

  const handleLastTupleChange = (elementIdx: number, value: string) => {
    lastTuple[elementIdx] = value;

    const domainTuple = [...tuples, lastTuple];
    dispatch(
      updateDatabaseViewValue({ type: tupleType, tupleName, domainTuple }),
    );
  };

  const displayTuples = !lastTupleIsValid ? tuples : [...tuples, lastTuple];
  const correctedArity = tupleType === "function" ? tupleArity + 1 : tupleArity;

  return (
    <>
      <Table className="table-bordered matrix-view-table">
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

            return (
              <tr
                key={`row-${tupleIdx}`}
                className={isDuplicate ? "error" : ""}
              >
                {Array.from({ length: correctedArity }, (_, idx) => {
                  const isLeftover = leftoverDomain.includes(tuple[idx]);

                  return (
                    <td
                      key={`col-${idx}`}
                      className={isLeftover ? "error" : ""}
                    >
                      {tupleType === "function" &&
                      idx !== correctedArity - 1 ? (
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
                        />
                      )}
                    </td>
                  );
                })}

                {!locked && !isLast && tupleType === "predicate" && (
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

      {!error &&
        (duplicateTuples.size !== 0 || leftoverDomain.length !== 0) && (
          <p className="text-danger small m-1">
            {duplicateTuples.size !== 0
              ? "There are duplicate tuples."
              : `Element ${leftoverDomain[0]} is not in domain.`}
          </p>
        )}
    </>
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
    <td style={{ width: "1%" }} className="align-middle">
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
