import {
  selectEvaluatedFormula,
  selectFormulas,
  updateText,
} from "../../features/formulas/formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";

export default function PrettifyButton() {
  const allFormulas = useAppSelector(selectFormulas);
  const dispatch = useAppDispatch();
  const evaluatedFormulas = useAppSelector((state) =>
    allFormulas.map((_, id) => selectEvaluatedFormula(state, id)),
  );

  const prettifyAll = () => {
    evaluatedFormulas.forEach((evaluated, id) => {
      if (evaluated?.formula) {
        dispatch(updateText({ id, text: evaluated.formula.toString() }));
      }
    });
  };

  return (
    <Button onClick={prettifyAll} variant="outline-success">
      <FontAwesomeIcon size="sm" icon={faMagicWandSparkles} className="me-1" />
      Prettify formulas
    </Button>
  );
}
