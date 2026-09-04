import InputGroup from "react-bootstrap/InputGroup";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {
  removeFormula,
  updateGuess,
  selectEvaluatedFormula,
  selectIsVerifiedGame,
  selectGameResetIndex,
  gameGoBack,
  lockFormula,
  lockFormulaGuess,
  updateFormulaText,
  selectFormula,
} from "./formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import ErrorFeedback from "../../shared/ui/ErrorFeedback";
import { Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import GameComponent from "../game/GameComponent";
import { useEffect, useState } from "react";
import { selectTeacherMode } from "../teacherMode/teacherModeSlice";
import LockButton from "../../shared/ui/LockButton";
import { UndoActions } from "../undoHistory/undoHistory";
import { useFormulasContext } from "../../providers/logicContext";
import { selectNonFormulaValidationError } from "../../shared/core/formulas";

interface Props {
  id: number;
}

export default function FormulaComponent({ id }: Props) {
  const dispatch = useAppDispatch();
  const [showGame, setShowGame] = useState(false);

  const { name, text, guess, locked, lockedGuess } = useAppSelector((state) =>
    selectFormula(state, id),
  );
  const { error: formulaError, formula } = useAppSelector((state) =>
    selectEvaluatedFormula(state, id),
  );
  const validationErrorMessage = useAppSelector(
    selectNonFormulaValidationError,
  );
  const isVerified = useAppSelector((state) => selectIsVerifiedGame(state, id));
  const backIndex = useAppSelector((state) => selectGameResetIndex(state, id));
  const teacherMode = useAppSelector(selectTeacherMode);

  const { formulas: contextFormulas } = useFormulasContext();
  const contextFormulasNames = new Set(
    contextFormulas.map((formula) => formula.name),
  );
  const isFromContext = !!name;
  const isMissingInContext = isFromContext && !contextFormulasNames.has(name);

  const contextError = isMissingInContext
    ? new Error(`Formula is missing in context. ${formulaError?.message ?? ""}`)
    : undefined;

  const nonFormulaError = validationErrorMessage
    ? new Error(validationErrorMessage)
    : undefined;

  useEffect(() => {
    dispatch(gameGoBack({ id, index: backIndex }));
  }, [backIndex, dispatch, id]);

  const displayName = `${isFromContext ? name : `\\varphi_{${id + 1}}`}`;
  const error = contextError || formulaError || nonFormulaError;

  const gameStatus =
    error || isVerified === undefined ? "tbd" : isVerified ? "won" : "lost";

  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Row>
        <InputGroup className="mb-2" size="sm" hasValidation={!!error}>
          <InputGroup.Text>
            <InlineMath>{`${displayName} \\equiv`}</InlineMath>
          </InputGroup.Text>
          <Form.Control
            placeholder="Formula"
            aria-label="Formula"
            disabled={isFromContext || locked === true}
            value={text}
            onChange={(e) => {
              dispatch(updateFormulaText({ id, text: e.target.value }));
            }}
            isInvalid={!!error}
            onBlur={() => dispatch(UndoActions.checkpoint())}
          />

          {!locked && (
            <Button
              variant="outline-danger"
              aria-label="Remove formula"
              onClick={() => {
                dispatch(removeFormula(id));
                dispatch(UndoActions.checkpoint());
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}

          {teacherMode === true && (
            <LockButton
              locked={locked}
              locker={() => dispatch(lockFormula(id))}
            />
          )}

          <ErrorFeedback error={error} text={text} />
        </InputGroup>
      </Row>

      <Row className="align-items-start mb-3 formula-select-container">
        <Col xs="auto">
          <InputGroup
            hasValidation={guess !== null}
            size="sm"
            className="formula-select-input-group"
          >
            <InputGroup.Text>
              <InlineMath>{String.raw`\mathcal{M}`}</InlineMath>
            </InputGroup.Text>

            <Form.Select
              aria-label="Select"
              value={
                guess === true ? "true" : guess === false ? "false" : "null"
              }
              onChange={(e) => {
                dispatch(
                  updateGuess({
                    id,
                    guess:
                      e.target.value === "true"
                        ? true
                        : e.target.value === "false"
                          ? false
                          : null,
                  }),
                );

                dispatch(UndoActions.checkpoint());
              }}
              disabled={lockedGuess === true}
              isValid={gameStatus === "won" && guess !== null}
              isInvalid={gameStatus === "lost" && guess !== null}
            >
              <option value="null">⊨/⊭?</option>
              <option value="true">⊨</option>
              <option value="false">⊭</option>
            </Form.Select>

            <InputGroup.Text>
              <InlineMath>{`${displayName}[e]`}</InlineMath>
            </InputGroup.Text>

            {teacherMode === true && (
              <LockButton
                locked={lockedGuess}
                locker={() => dispatch(lockFormulaGuess(id))}
              />
            )}

            {gameStatus === "won" && (
              <Form.Control.Feedback type="valid">
                Verified!
              </Form.Control.Feedback>
            )}

            {gameStatus === "lost" && (
              <Form.Control.Feedback type="invalid">
                Failed verification!
              </Form.Control.Feedback>
            )}

            {guess !== null && gameStatus === "tbd" && (
              <div
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  fontSize: "0.875rem",
                  color: "var(--bs-warning-text-emphasis)",
                }}
              >
                Not verified.
              </div>
            )}
          </InputGroup>
        </Col>

        <Col xs="auto">
          <GameVerificationButton
            gameStatus={gameStatus}
            gameOpened={showGame}
            didSelectGuess={guess !== null}
            disabled={!!error || guess === null}
            onClick={() => setShowGame(!showGame)}
          />
        </Col>
      </Row>

      {showGame && guess !== null && !error && (
        <GameComponent id={id} guess={guess} originalFormula={formula} />
      )}
    </Form>
  );
}

interface GameVerificationButtonProps {
  gameStatus: "tbd" | "won" | "lost";
  disabled: boolean;
  gameOpened: boolean;
  onClick: () => void;
  didSelectGuess: boolean;
}

function GameVerificationButton({
  gameStatus,
  disabled,
  gameOpened,
  onClick,
  didSelectGuess,
}: GameVerificationButtonProps) {
  const isVerified = gameStatus !== "tbd" && didSelectGuess;

  const buttonVariant = !isVerified
    ? "warning"
    : gameStatus === "won"
      ? "success"
      : "danger";

  const outcome = gameStatus === "won" ? "verification" : "failed verification";
  const buttonAction = gameOpened ? "Hide" : "Show";

  const buttonText = !isVerified ? "Verify" : `${buttonAction} ${outcome}`;

  return (
    <Button
      variant={buttonVariant}
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      {buttonText}
    </Button>
  );
}
