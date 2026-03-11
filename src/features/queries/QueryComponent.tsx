import { Button, Form, InputGroup, Stack } from "react-bootstrap";
import {
  getQueryResults,
  lockQuery,
  removeQuery,
  selectEvaluatedQuery,
  selectParsedQueryVariables,
  selectQuery,
  updateQueryStaleness,
  updateQueryText,
  updateQueryVariablesText,
  type QueryResult,
} from "./queriesSlice";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import { UndoActions } from "../undoHistory/undoHistory";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { selectTeacherMode } from "../teacherMode/teacherModeslice";
import LockButton from "../../components_helper/LockButton";
import ErrorFeedback from "../../components_helper/ErrorFeedback";
import { useState } from "react";
import QueryResults from "./QueryResults";
import { selectNonFormulaValidationError } from "../../common/formulas";

export interface QueryComponentProps {
  idx: number;
}

export default function QueryComponent({ idx }: QueryComponentProps) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const nonFormulaErrorMessage = useAppSelector(
    selectNonFormulaValidationError,
  );

  const teacherMode = useAppSelector(selectTeacherMode);

  const query = useAppSelector((state) => selectQuery(state, idx));
  const evaluatedQuery = useAppSelector((state) =>
    selectEvaluatedQuery(state, idx),
  );
  const queryVariables = useAppSelector((state) =>
    selectParsedQueryVariables(state, idx),
  );
  const { text: queryText, variablesText, locked } = query;

  const handleQueryButtonClick = () => {
    dispatch(updateQueryStaleness({ idx, stale: false }));

    const queryResults = getQueryResults(store.getState(), idx);
    setQueryResults(queryResults);
  };

  const nonQueryError = nonFormulaErrorMessage
    ? new Error(nonFormulaErrorMessage)
    : undefined;

  const error = queryVariables.error || evaluatedQuery.error || nonQueryError;

  return (
    <Stack gap={2}>
      <Stack
        gap={2}
        direction="horizontal"
        style={{ width: "100%", alignItems: "flex-start" }}
      >
        <InputGroup size="sm" hasValidation={!!error}>
          <InputGroup.Text className="input-group-fix-height">
            <InlineMath>{`\\psi_${idx + 1} (`}</InlineMath>
          </InputGroup.Text>

          <Form.Control
            value={variablesText}
            onChange={(e) =>
              dispatch(updateQueryVariablesText({ idx, text: e.target.value }))
            }
            disabled={locked}
            isInvalid={!!queryVariables.error}
            onBlur={() => dispatch(UndoActions.checkpoint())}
            style={{ maxWidth: "5rem" }}
          />

          <InputGroup.Text>
            <InlineMath>{`)\\equiv`}</InlineMath>
          </InputGroup.Text>

          <Form.Control
            value={queryText}
            onChange={(e) =>
              dispatch(updateQueryText({ idx, text: e.target.value }))
            }
            disabled={locked}
            isInvalid={!!evaluatedQuery.error || !!nonQueryError}
            onBlur={() => dispatch(UndoActions.checkpoint())}
          />

          {!locked && (
            <Button
              variant="outline-danger"
              onClick={() => {
                dispatch(removeQuery({ idx }));
                dispatch(UndoActions.checkpoint());
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}

          {teacherMode && (
            <LockButton
              locked={locked}
              locker={() => dispatch(lockQuery({ idx }))}
            />
          )}

          <ErrorFeedback
            error={evaluatedQuery.error || nonQueryError}
            text={queryText}
          />
        </InputGroup>

        <Button
          variant="success"
          size="sm"
          style={{ width: "fit-content" }}
          onClick={handleQueryButtonClick}
          disabled={!!error}
        >
          Query
        </Button>
      </Stack>

      {queryResults.length > 0 && (
        <QueryResults
          queryIdx={idx}
          stale={query.stale}
          queryVariables={queryVariables.parsed ?? []}
          results={queryResults}
          onResultsReset={() => setQueryResults([])}
        />
      )}
    </Stack>
  );
}
