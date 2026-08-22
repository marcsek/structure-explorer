import { Button, Form, InputGroup, Stack } from "react-bootstrap";
import {
  getQueryResults,
  toggleQueryLock,
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
import { selectTeacherMode } from "../teacherMode/teacherModeSlice";
import LockButton from "../../shared/ui/LockButton";
import ErrorFeedback from "../../shared/ui/ErrorFeedback";
import { useEffect, useState } from "react";
import QueryResults from "./QueryResults";
import { selectNonFormulaValidationError } from "../../shared/core/formulas";

export interface QueryComponentProps {
  idx: number;
}

export default function QueryComponent({ idx }: QueryComponentProps) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [showResults, setShowResults] = useState(false);
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

  const handleQueryButtonClick = () => {
    dispatch(updateQueryStaleness({ idx, stale: false }));

    setQueryResults(getQueryResults(store.getState(), idx));
    setShowResults(true);
  };

  const serializedVars = queryVariables?.parsed?.join() ?? "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowResults(false);
  }, [serializedVars]);

  if (!query) return null;

  const nonQueryError = nonFormulaErrorMessage
    ? new Error(nonFormulaErrorMessage)
    : undefined;

  const error = queryVariables?.error || evaluatedQuery?.error || nonQueryError;
  const variablesError =
    queryVariables?.error || queryVariables?.parsed?.length === 0;

  const { text: queryText, variablesText, locked } = query;

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
            isInvalid={!!variablesError}
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
            isInvalid={!!evaluatedQuery?.error || !!nonQueryError}
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
              locker={() => dispatch(toggleQueryLock({ idx }))}
            />
          )}

          <ErrorFeedback
            error={evaluatedQuery?.error || nonQueryError}
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

      {showResults && (
        <QueryResults
          queryIdx={idx}
          stale={query.stale}
          queryVariables={queryVariables?.parsed ?? []}
          results={queryResults}
          onResultsClose={() => setShowResults(false)}
        />
      )}
    </Stack>
  );
}
