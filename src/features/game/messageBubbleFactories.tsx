import { InlineMath } from "react-katex";
import { latex } from "../../common/utils";
import type { BubbleFormat } from "./GameHistory";
import type { SignedFormula } from "../../model/formula/Formula";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import type Structure from "../../model/Structure";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";

export const getAssumptionBubble = (
  sFormula: SignedFormula,
  valuation: string,
) => {
  const { sign, formula } = sFormula;
  return {
    text: (
      <>
        You assume that{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation(valuation).get()}
        </InlineMath>
      </>
    ),
    sender: "game",
  } as BubbleFormat;
};

export const getAlphaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
) => {
  const bubbles: BubbleFormat[] = [];

  const { sign, formula } = sFormula;

  bubbles.push({
    text: (
      <>
        Then{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation(valuation).get()}
        </InlineMath>
      </>
    ),
    sender: "game",
  });

  if (!isLast) {
    bubbles.push({ text: <>Continue</>, sender: "player" });
  }

  return bubbles;
};

export const getBetaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
  bubbleIdx: number,
  choiceIdx?: number,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;
  const subFormulas = formula.getSignedSubFormulas(sign);

  bubbles.push({
    text: <>Which option is true?</>,
    sender: "game",
  });

  subFormulas.forEach((s) =>
    bubbles.push({
      text: (
        <InlineMath>
          {latex()
            .M()
            .models(s.sign)
            .formula(s.formula)
            .valuation(valuation)
            .get()}
        </InlineMath>
      ),
      sender: "game",
    }),
  );

  if (!isLast && choiceIdx !== undefined) {
    const { sign: chSign, formula: chFormula } = subFormulas[choiceIdx];

    bubbles.push({
      text: (
        <InlineMath>
          {latex()
            .M()
            .models(chSign)
            .formula(chFormula)
            .valuation(valuation)
            .get()}
        </InlineMath>
      ),
      sender: "player",
      goBack: bubbleIdx,
    });
  }

  return bubbles;
};

export const getGammaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
  winElement: string,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  if (!(formula instanceof QuantifiedFormula)) return bubbles;

  bubbles.push({
    text: (
      <>
        Then{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation(valuation).get()}
        </InlineMath>{" "}
        also when we assign element{" "}
        <InlineMath>{latex().text(winElement).get()}</InlineMath> to{" "}
        <InlineMath>{formula.variableName}</InlineMath>
      </>
    ),
    sender: "game",
  });

  if (!isLast) {
    bubbles.push({ text: <>Continue</>, sender: "player" });
  }

  return bubbles;
};

export const getDeltaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
  bubbleIdx: number,
  element: string,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  if (!(formula instanceof QuantifiedFormula)) return bubbles;

  bubbles.push({
    text: (
      <>
        Which domain element should we assign to{" "}
        <InlineMath>{formula.variableName}</InlineMath> to show that{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation(valuation).get()}
        </InlineMath>
      </>
    ),
    sender: "game",
  });

  if (!isLast) {
    bubbles.push({
      text: (
        <>
          Assign <InlineMath>{latex().text(element).get()}</InlineMath> to{" "}
          <InlineMath>{formula.variableName}</InlineMath>
        </>
      ),
      sender: "player",
      goBack: bubbleIdx,
    });
  }

  return bubbles;
};

export const getGameResultBubble = (
  sFormula: SignedFormula,
  explanation: JSX.Element,
  won: boolean,
  originallyCorrect: boolean,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  const couldHaveWon = originallyCorrect && !won;

  bubbles.push({
    text: (
      <>
        <strong>{won ? "You win" : "You lose"}</strong>, because{" "}
        <InlineMath>
          {latex()
            .M()
            .models(sign === won)
            .formula(formula)
            .get()}
        </InlineMath>
        {explanation}
      </>
    ),
    sender: "game",
    win: won,
    lose: !won,
    fixableLoss: couldHaveWon || undefined,
  });

  bubbles.push({
    text: (
      <>
        {couldHaveWon && (
          <>
            <strong>You could have won, though.</strong>
          </>
        )}
        Your initial assumption that{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation().get()}
        </InlineMath>{" "}
        was
        {originallyCorrect ? " correct." : " incorrect."}{" "}
        {couldHaveWon && (
          <>
            Find incorrect intermediate answers and correct them! You can use{" "}
            <strong>change button</strong> next to your answers for that.
          </>
        )}
      </>
    ),
    sender: "game",
  });

  return bubbles;
};

export const generateExplanation = (
  sFormula: SignedFormula,
  won: boolean,
  structure: Structure,
  valuation: Map<string, string>,
  valuationText: string,
) => {
  const { sign, formula } = sFormula;

  let explanationBody = "";
  if (formula instanceof PredicateAtom) {
    const termNames = formula.terms
      .map((t) =>
        latex().raw(t.toTex()).sup(latex().M().get()).altValuation().get(),
      )
      .join(", ");

    const termValues = latex()
      .text(formula.terms.map((t) => t.eval(structure, valuation)).join(", "))
      .get();

    const interpretation = latex().text(formula.name).get();

    const connective = sign === won ? "\\in" : "\\not\\in";

    const equality =
      formula.terms.length > 1
        ? `(${termNames}) = (${termValues})`
        : `${termNames} = ${termValues}`;

    explanationBody = `${equality} ${connective} i(${interpretation})`;
  }

  if (formula instanceof EqualityAtom) {
    const leftTerm = latex()
      .raw(formula.subLeft.toTex())
      .sup(latex().M().get())
      .altValuation()
      .get();
    const leftValue = latex()
      .text(formula.subLeft.eval(structure, valuation))
      .get();

    const rightTerm = latex()
      .raw(formula.subRight.toTex())
      .sup(latex().M().get())
      .altValuation()
      .get();
    const rightValue = latex()
      .text(formula.subRight.eval(structure, valuation))
      .get();

    const connective = sign === won ? "=" : "\\neq";

    explanationBody = `${leftTerm} = ${leftValue} ${connective} ${rightValue} = ${rightTerm}`;
  }

  return (
    <>
      <InlineMath>{"[e']"}</InlineMath>, since{" "}
      <InlineMath>{explanationBody}</InlineMath> where{" "}
      <InlineMath>{`e' = ${latex().rawValuation(valuationText).get()}`}</InlineMath>
    </>
  );
};
