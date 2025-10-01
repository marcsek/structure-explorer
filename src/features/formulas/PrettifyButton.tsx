import {
  selectEvaluatedFormula,
  selectFormulas,
  updateText,
} from "../../features/formulas/formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "react-bootstrap";

export default function PrettifyButton() {
  const allFormulas = useAppSelector(selectFormulas);
  const dispatch = useAppDispatch();
  const evaluatedFormulas = useAppSelector((state) =>
    allFormulas.map((_, id) => selectEvaluatedFormula(state, id))
  );

  const prettifyAll = () => {
    evaluatedFormulas.forEach((evaluated, id) => {
      if (evaluated?.formula) {
        dispatch(updateText({ id, text: evaluated.formula.toString() }));
      }
    });
  };

  return (
    <Button onClick={prettifyAll} variant="success" className="mb-2">
      Prettify formulas
    </Button>
  );
}
