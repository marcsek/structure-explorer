import {
  gameGoBack,
  getDiffAndNew,
  selectFormulaChoices,
  selectHistoryData,
} from "../formulas/formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectStructure } from "../structure/structureSlice";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import MessageBubble from "../../components_helper/bubbles/MessageBubble";
import { useEffect, useRef, type ReactNode } from "react";
import { selectValuation } from "../variables/variablesSlice";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import { Stack } from "react-bootstrap";
import { latex } from "../../common/utils";
import {
  generateExplanation,
  getAlphaBubbles,
  getAssumptionBubble,
  getBetaBubbles,
  getDeltaBubbles,
  getGameResultBubble,
  getGammaBubbles,
} from "./messageBubbleFactories";

export type BubbleFormat = {
  text: ReactNode;
  sender: "game" | "player";
  goBack?: number;
  win?: boolean;
  lose?: boolean;
  fixableLoss?: boolean;
};

interface Props {
  id: number;
}

export default function GameHistory({ id }: Props) {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => selectHistoryData(state, id));
  const structure = useAppSelector(selectStructure);
  const choices = useAppSelector((state) => selectFormulaChoices(state, id));
  const bottomScrollElement = useRef<HTMLDivElement>(null);
  const initialValuation = useAppSelector(selectValuation);

  useEffect(() => {
    if (bottomScrollElement.current)
      bottomScrollElement.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [data]);

  const bubbles: BubbleFormat[] = [];

  let bubbleIdx = 0;
  for (const { sf, valuation, type, winFormula } of data) {
    const valuationDiff = getDiffAndNew(initialValuation, valuation);
    const valuationText = latex().valuationPairs(valuationDiff);

    bubbles.push(getAssumptionBubble(sf, valuationText));

    const hasSubFormulas = sf.formula.getSubFormulas().length > 0;

    if (
      (!hasSubFormulas && sf.formula instanceof PredicateAtom) ||
      sf.formula instanceof EqualityAtom
    ) {
      const satisfied = sf.formula.eval(structure, valuation) === sf.sign;
      const originalFormula = data[0].sf;
      const originallyCorrect =
        data[0].rootFormulaEval === originalFormula.sign;

      const explanation = generateExplanation(
        sf,
        satisfied,
        structure,
        valuation,
        valuationText,
      );

      bubbles.push(
        ...getGameResultBubble(
          sf,
          explanation,
          satisfied,
          originalFormula,
          originallyCorrect,
        ),
      );

      break;
    }

    const isLastBubble = bubbleIdx >= choices.length;

    if (type === "alpha" && winFormula) {
      bubbles.push(...getAlphaBubbles(sf, valuationText, isLastBubble));
    }

    if (type === "beta") {
      bubbles.push(
        ...getBetaBubbles(
          sf,
          valuationText,
          isLastBubble,
          bubbleIdx,
          !isLastBubble ? choices[bubbleIdx].formula : undefined,
        ),
      );
    }

    if (type === "gamma") {
      bubbles.push(...getGammaBubbles(sf, valuationText, isLastBubble));
    }

    if (type === "delta") {
      bubbles.push(
        ...getDeltaBubbles(
          sf,
          valuationText,
          isLastBubble,
          bubbleIdx,
          choices[bubbleIdx]?.element ?? "",
        ),
      );
    }

    bubbleIdx++;
  }

  return (
    <Stack gap={1}>
      {bubbles.map(
        ({ text, sender, goBack, win, lose, fixableLoss }, index) => (
          <MessageBubble
            key={`${index}-${sender}`}
            children={text}
            sent={sender === "player"}
            recieved={sender === "game"}
            onClick={
              goBack !== undefined
                ? () => dispatch(gameGoBack({ id: id, index: goBack }))
                : undefined
            }
            change={goBack !== undefined}
            lose={lose}
            win={win}
            fixableLoss={fixableLoss}
          />
        ),
      )}
      <div ref={bottomScrollElement} />
    </Stack>
  );
}
