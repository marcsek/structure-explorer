import InputGroup from "react-bootstrap/InputGroup";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {
  removeFormula,
  updateText,
  updateGuess,
  selectEvaluatedFormula,
  selectIsVerifiedGame,
  selectGameResetIndex,
  gameGoBack,
  selectFormulaLock,
  selectFormulaGuessLock,
  lockFormula,
  lockFormulaGuess,
} from "./formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import ErrorFeedback from "../../components_helper/ErrorFeedback";
import { Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import GameComponent from "../game/GameComponent";
import { useEffect, useState } from "react";
import {
  selectValidatedDomain,
  selectStructureErrors,
} from "../structure/structureSlice";
import { selectValidatedVariables } from "../variables/variablesSlice";
import { selectTeacherMode } from "../teacherMode/teacherModeslice";
import LockButton from "../../components_helper/LockButton";
import { UndoActions } from "../undoHistory/undoHistory";
import { useFormulasContext } from "../../logicContext";
import { selectLanguageErrors } from "../language/languageSlice";
import type { InterpretationError } from "../../common/errors";

interface Props {
  id: number;
  name?: string;
  text: string;
  guess: boolean | null;
}

function getErrorMessageFromValidation(
  errors: Partial<{
    languageError: InterpretationError;
    structureError: InterpretationError;
    variablesError: InterpretationError;
  }>,
) {
  const locations: string[] = [];

  if (errors.languageError) locations.push("language");
  if (errors.structureError) locations.push("structure");
  if (errors.variablesError) locations.push("variable assignment");

  if (locations.length === 0) return "";
  return `There are errors in: ${locations.join(", ")}.`;
}

export default function FormulaComponent({ id, text, guess, name }: Props) {
  const isFromContext = !!name;
  const real_id = id + 1;
  const dispatch = useAppDispatch();
  const { error: formulaError, formula } = useAppSelector((state) =>
    selectEvaluatedFormula(state, id),
  );
  const [begin, setBegin] = useState(false);

  const domain = useAppSelector(selectValidatedDomain);
  const isVerified = useAppSelector((state) => selectIsVerifiedGame(state, id));
  const backIndex = useAppSelector((state) => selectGameResetIndex(state, id));
  const structureError = useAppSelector(selectStructureErrors);
  const languageError = useAppSelector(selectLanguageErrors);
  const { error: variablesError } = useAppSelector(selectValidatedVariables);
  const teacherMode = useAppSelector(selectTeacherMode);
  const locked = useAppSelector((state) => selectFormulaLock(state, id));
  const lockedGuess = useAppSelector((state) =>
    selectFormulaGuessLock(state, id),
  );
  const { formulas: contextFormulas } = useFormulasContext();
  const contextFormulasNames = new Set(
    contextFormulas.map((formula) => formula.name),
  );
  const isMissingInContext = isFromContext && !contextFormulasNames.has(name);

  const contextError = isMissingInContext
    ? new Error(`Formula is missing in context. ${formulaError?.message ?? ""}`)
    : undefined;

  const validtionErrorMessage = getErrorMessageFromValidation({
    languageError,
    structureError,
    variablesError,
  });

  const nonFormulaError = validtionErrorMessage
    ? new Error(validtionErrorMessage)
    : undefined;

  const isPlayable = !nonFormulaError;

  useEffect(() => {
    dispatch(gameGoBack({ id, index: backIndex }));
  }, [backIndex, dispatch, id]);

  const displayName = `${isFromContext ? name : `\\varphi_{${real_id}}`}`;
  const error = contextError || formulaError || nonFormulaError;

  return (
    <>
      <Form>
        <Row>
          <InputGroup className="mb-2" hasValidation={!!error}>
            <InputGroup.Text>
              <InlineMath>{`${displayName} =`}</InlineMath>
            </InputGroup.Text>
            <Form.Control
              placeholder="Formula"
              aria-label="Formula"
              aria-describedby="basic-addon2"
              disabled={isFromContext || locked === true}
              value={text}
              onChange={(e) => {
                dispatch(updateText({ id: id, text: e.target.value }));
              }}
              isInvalid={!!error}
              onBlur={() => dispatch(UndoActions.checkpoint())}
            />

            <Button
              variant="outline-danger"
              id="button-addon2"
              disabled={locked === true}
              onClick={() => {
                dispatch(removeFormula(id));
                dispatch(UndoActions.checkpoint());
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
            {teacherMode === true && (
              <LockButton
                locked={locked}
                locker={() => dispatch(lockFormula(id))}
              />
            )}

            <ErrorFeedback error={error} text={text}></ErrorFeedback>
          </InputGroup>
        </Row>

        <Row className="align-items-start mb-3 formula-select-container">
          <Col xs="auto">
            <InputGroup hasValidation className="formula-select-input-group">
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
                isValid={isVerified && guess !== null}
                isInvalid={!isVerified && guess !== null}
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

              {isVerified && (
                <Form.Control.Feedback type="valid">
                  Verified!
                </Form.Control.Feedback>
              )}

              {!isVerified && (
                <Form.Control.Feedback type="invalid">
                  Not verified!
                </Form.Control.Feedback>
              )}
            </InputGroup>
          </Col>

          <Col xs="auto">
            <Button
              variant={isVerified ? "success" : "danger"}
              disabled={
                !!error ||
                guess === null ||
                domain.error !== undefined ||
                isPlayable === false
              }
              onClick={() => {
                setBegin(!begin);
              }}
            >
              {!isVerified
                ? "Verify"
                : begin
                  ? "Hide verification"
                  : "Show verification"}
            </Button>
          </Col>
        </Row>
        {begin &&
          guess !== null &&
          formula &&
          domain.error === undefined &&
          isPlayable === true && (
            <GameComponent id={id} guess={guess} originalFormula={formula} />
          )}
      </Form>
    </>
  );
}
