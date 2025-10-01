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
  selectParsedDomain,
  selectStructureErrors,
} from "../structure/structureSlice";
import { selectParsedVariables } from "../variables/variablesSlice";
import { selectTeacherMode } from "../teacherMode/teacherModeslice";

interface Props {
  id: number;
  text: string;
  guess: boolean | null;
}

export default function FormulaComponent({ id, text, guess }: Props) {
  const real_id = id + 1;
  const dispatch = useAppDispatch();
  const { error, formula } = useAppSelector((state) =>
    selectEvaluatedFormula(state, id)
  );
  const [begin, setBegin] = useState(false);

  const domain = useAppSelector(selectParsedDomain);
  const isVerified = useAppSelector((state) => selectIsVerifiedGame(state, id));
  const backIndex = useAppSelector((state) => selectGameResetIndex(state, id));
  const structureErrors = useAppSelector(selectStructureErrors);
  const variablesErrors = useAppSelector(selectParsedVariables);
  const teacherMode = useAppSelector(selectTeacherMode);
  const locked = useAppSelector((state) => selectFormulaLock(state, id));
  const lockedGuess = useAppSelector((state) =>
    selectFormulaGuessLock(state, id)
  );

  const isPlayable = structureErrors && variablesErrors.error === undefined;

  useEffect(() => {
    dispatch(gameGoBack({ id, index: backIndex }));
  });

  return (
    <>
      <Form>
        <Row>
          <InputGroup className="mb-3" hasValidation={!!error}>
            <InputGroup.Text>
              <InlineMath>{String.raw`\varphi_{${real_id}} =`}</InlineMath>
            </InputGroup.Text>
            <Form.Control
              placeholder="Formula"
              aria-label="Formula"
              aria-describedby="basic-addon2"
              disabled={locked === true}
              value={text}
              onChange={(e) => {
                dispatch(updateText({ id: id, text: e.target.value }));
              }}
              isInvalid={!!error}
            />

            <Button
              variant="outline-danger"
              id="button-addon2"
              disabled={locked === true}
              onClick={() => dispatch(removeFormula(id))}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
            {teacherMode === true && (
              <Button
                variant="secondary"
                onClick={() => dispatch(lockFormula(id))}
              >
                {locked === true ? "Unlock" : "Lock"}
              </Button>
            )}

            <ErrorFeedback error={error} text={text}></ErrorFeedback>
          </InputGroup>
        </Row>

        <Row className="align-items-start mb-3">
          <Col xs="auto">
            <InputGroup hasValidation>
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
                    })
                  );
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
                <InlineMath>{String.raw`\varphi_{${real_id}}[e]`}</InlineMath>
              </InputGroup.Text>
              {teacherMode === true && (
                <Button
                  onClick={() => dispatch(lockFormulaGuess(id))}
                  variant="secondary"
                >
                  {lockedGuess === true ? "Unlock" : "Lock"}
                </Button>
              )}

              <Form.Control.Feedback type="valid">
                Verified!
              </Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Not verified!
              </Form.Control.Feedback>
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
        {console.log(isPlayable)}
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
