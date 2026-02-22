import { Button, Form, InputGroup } from "react-bootstrap";
import {
  lockQuery,
  removeQuery,
  selectEvaluatedQuery,
  selectQuery,
  updateQueryText,
} from "./queriesSlice";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { UndoActions } from "../undoHistory/undoHistory";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { selectTeacherMode } from "../teacherMode/teacherModeslice";
import LockButton from "../../components_helper/LockButton";
import ErrorFeedback from "../../components_helper/ErrorFeedback";

export interface QueryComponentProps {
  idx: number;
}

export default function QueryComponent({ idx }: QueryComponentProps) {
  const dispatch = useAppDispatch();

  const teacherMode = useAppSelector(selectTeacherMode);

  const query = useAppSelector((state) => selectQuery(state, idx));
  const evaluatedQuery = useAppSelector((state) =>
    selectEvaluatedQuery(state, idx),
  );

  const { text: queryText, locked } = query;

  return (
    <InputGroup size="sm" hasValidation={!!evaluatedQuery.error}>
      <InputGroup.Text>
        <InlineMath>{"\\forall x, y \\ (x, y) \\equiv"}</InlineMath>
      </InputGroup.Text>

      <Form.Control
        value={queryText}
        onChange={(e) =>
          dispatch(updateQueryText({ idx, text: e.target.value }))
        }
        disabled={locked}
        isInvalid={!!evaluatedQuery.error}
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

      <ErrorFeedback error={evaluatedQuery.error} text={queryText} />
    </InputGroup>
  );
}
