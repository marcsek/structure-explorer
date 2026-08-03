import { Button, ButtonGroup, Stack } from "react-bootstrap";
import { useAppSelector } from "../app/hooks";
import GearButton from "../features/import/GearButton";
import { useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { UndoActions } from "../features/undoHistory/undoHistory";

export default function Header() {
  return (
    <Stack
      className="mb-2 header-container justify-content-between"
      direction="horizontal"
    >
      <HistoryButtons />
      <GearButton />
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
