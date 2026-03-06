import {
  selectEvaluatedFormulas,
  selectFormulas,
  updateText,
} from "../../features/formulas/formulasSlice";
import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { UndoActions } from "../undoHistory/undoHistory";

export default function PrettifyButton() {
  const allFormulas = useAppSelector(selectFormulas);
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const prettifyAll = () => {
    let someNeededUpdate = false;

    const evaluatedFormulas = selectEvaluatedFormulas(store.getState());

    evaluatedFormulas.forEach((evaluated, id) => {
      if (evaluated?.formula) {
        const evalutedText = evaluated.formula.toString();
        dispatch(updateText({ id, text: evalutedText }));

        someNeededUpdate ||=
          allFormulas[id].text !== evaluated.formula.toString();
      }
    });

    if (someNeededUpdate) dispatch(UndoActions.checkpoint());
  };

  return (
    <Button onClick={prettifyAll} variant="outline-success" size="sm">
      <FontAwesomeIcon size="sm" icon={faMagicWandSparkles} className="me-1" />
      Prettify formulas
    </Button>
  );
}
