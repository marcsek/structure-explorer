import { Button, ButtonGroup, Stack } from "react-bootstrap";
import { useAppSelector } from "../app/hooks";
import GearButton from "../features/import/GearButton";
import { selectTeacherMode } from "../features/teacherMode/teacherModeslice";
import { useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { UndoActions } from "../features/undoHistory/undoHistory";

export default function Header() {
  const teacherMode = useAppSelector(selectTeacherMode);

  const teacherModeStatus =
    teacherMode === false ? "Off" : teacherMode === true ? "On" : "Undefined";

  return (
    <Stack
      className="mb-2 header-container"
      direction="horizontal"
      style={{ justifyContent: "space-between" }}
    >
      <HistoryButtons />

      <Stack direction="horizontal" gap={3}>
        <span>{`Teacher mode: ${teacherModeStatus}`}</span>
        <GearButton />
      </Stack>
    </Stack>
  );
}

function HistoryButtons() {
  const dispatch = useDispatch();
  const canUndo = useAppSelector((state) => state.past.length > 0);
  const canRedo = useAppSelector((state) => state.future.length > 0);

  return (
    <ButtonGroup>
      <Button
        variant="outline-secondary"
        disabled={!canUndo}
        onClick={() => dispatch(UndoActions.undo())}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
      </Button>
      <Button
        variant="outline-secondary"
        disabled={!canRedo}
        onClick={() => dispatch(UndoActions.redo())}
      >
        <FontAwesomeIcon icon={faRotateRight} />
      </Button>
    </ButtonGroup>
  );
}
