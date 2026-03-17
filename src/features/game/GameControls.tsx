import ChoiceBubbles, {
  type ChoiceBubble,
} from "../../components_helper/bubbles/ChoiceBubble";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addAlpha,
  addBeta,
  addDelta,
  addGamma,
  selectGameButtons,
} from "../formulas/formulasSlice";
import SelectBubble from "../../components_helper/bubbles/SelectBubble";
import { InlineMath } from "react-katex";
import { latex } from "../../common/utils";

export interface GameControlsProps {
  id: number;
}

function ControlsWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <div className="d-flex justify-content-center mb-3 mt-3">{children}</div>
  );
}

export default function GameControls({ id }: GameControlsProps) {
  const dispatch = useAppDispatch();
  const gameButtons = useAppSelector((state) => selectGameButtons(state, id));

  if (!gameButtons) {
    return <ControlsWrapper />;
  }

  const getBubbles = (): ChoiceBubble[] => {
    switch (gameButtons.type) {
      case "alpha":
        return [
          {
            value: "\\text{Continue}",
            onClick: () =>
              dispatch(addAlpha({ id, formula: gameButtons.winFormulaIdx })),
          },
        ];

      case "beta": {
        const { subFormulas, valuationDiff } = gameButtons;

        const valuationText = Array.from(valuationDiff)
          .map(([from, to]) => `(${from} / ${latex().text(to).get()})`)
          .join(" ");

        return subFormulas.map(({ formula, sign }, idx) => ({
          value: latex()
            .M()
            .models(sign)
            .formula(formula)
            .valuation(valuationText)
            .get(),
          onClick: () => dispatch(addBeta({ id, formula: idx })),
        }));
      }

      case "gamma": {
        const { winElement } = gameButtons;

        return [
          {
            value: "\\text{Continue}",
            onClick: () =>
              winElement && dispatch(addGamma({ id, element: winElement })),
          },
        ];
      }

      case "delta":
        return gameButtons.elements.map((element) => ({
          value: element,
          onClick: () => dispatch(addDelta({ id, element })),
        }));

      default:
        return [];
    }
  };

  const bubbles = getBubbles();

  return (
    <ControlsWrapper>
      {gameButtons.type === "delta" ? (
        <SelectBubble
          id={id}
          title={
            <>
              Select a domain element for{" "}
              <InlineMath>{gameButtons.variableName}</InlineMath>
            </>
          }
          type={gameButtons.type}
          bubbles={bubbles}
        />
      ) : (
        <ChoiceBubbles id={id} type={gameButtons.type} bubbles={bubbles} />
      )}
    </ControlsWrapper>
  );
}
