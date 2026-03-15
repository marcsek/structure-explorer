import ChoiceBubbles, {
  type ChoiceBubble,
} from "../../components_helper/ChoiceBubble";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addAlpha,
  addBeta,
  addDelta,
  addGamma,
  selectGameButtons,
  selectHistoryData,
} from "../formulas/formulasSlice";
import SelectBubble from "../../components_helper/SelectBubble";
import { selectValuation } from "../variables/variablesSlice";
import { getDiffAndNew } from "./GameHistory";
import { InlineMath } from "react-katex";

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
  const initialValuation = useAppSelector(selectValuation);
  const history = useAppSelector((state) => selectHistoryData(state, id));

  if (!gameButtons) {
    return <ControlsWrapper />;
  }

  const getBubbles = (): ChoiceBubble[] => {
    const latestHistory = history.at(-1);

    switch (gameButtons.type) {
      case "alpha":
        return [
          {
            value: "\\text{Continue}",
            onClick: () =>
              dispatch(addAlpha({ id, formula: latestHistory?.winIndex ?? 0 })),
          },
        ];

      case "beta": {
        const { subFormulas } = gameButtons;

        const valuationDiff = getDiffAndNew(
          initialValuation,
          latestHistory?.valuation ?? new Map(),
        );

        const valuationText = Array.from(valuationDiff)
          .map(([from, to]) => `(${from} / \\text{${to.replace(/_/g, "\\_")}})`)
          .join(" ");

        return subFormulas.map(({ formula, sign }, idx) => ({
          value: `\\mathcal{M} ${sign === true ? "\\models" : "\\not\\models"} ${formula.toTex()}[ e${valuationText} ]`,
          onClick: () => dispatch(addBeta({ id, formula: idx })),
        }));
      }

      case "gamma": {
        // This is a hacky way to get winElement, but recomputing can be expensive.
        const winElement = latestHistory?.winElement ?? "";

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
