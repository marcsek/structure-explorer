import "./QueryResults.css";

import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Table } from "react-bootstrap";
import { InlineMath } from "react-katex";
import type { QueryResult } from "./queriesSlice";
import { partition } from "../graphView/helpers/utils";
import { useState } from "react";

export interface QueryResultsProps {
  queryIdx: number;
  results: QueryResult[];
  queryVariables: string[];
  onResultsReset: () => void;
}

export default function QueryResults({
  queryIdx,
  results,
  queryVariables,
  onResultsReset,
}: QueryResultsProps) {
  const queryVariablesLen = queryVariables.length;
  const altVariables = queryVariables.map((v) => `${v}_1`);

  const correctAltVarsString =
    altVariables.length > 1 ? `(${altVariables})` : altVariables;
  const correctDomainPower =
    queryVariables.length > 1 ? `D^${queryVariablesLen}` : "D";

  const queryResultString = `\\ \\{${correctAltVarsString} \\in ${correctDomainPower} \\}`;

  const variablePairs = queryVariables
    .map((v, i) => `(${v}, ${altVariables[i]})`)
    .join("");

  const queryEvalResultString = `\\mathcal{M} \\models \\psi_${queryIdx + 1}[e${variablePairs}]`;

  const [correct, incorrect] = partition(results, ({ ok }) => ok);

  return (
    <div className="query-result-container">
      <div className="query-result-title">
        <span>
          Query results for
          <InlineMath>{queryResultString}</InlineMath>
        </span>

        <CloseButton onClick={onResultsReset} />
      </div>

      <QueryResultTable
        results={incorrect}
        kind="incorrect"
        evalResultIndicatorString={queryEvalResultString}
        variables={altVariables}
      />

      <QueryResultTable
        results={correct}
        kind="correct"
        evalResultIndicatorString={queryEvalResultString}
        variables={altVariables}
      />
    </div>
  );
}

const MIN_DISPLAY_COUNT = 3;
const DISPLAY_INCREMENT = 10;

interface QueryResultTableProps {
  results: QueryResult[];
  kind: "correct" | "incorrect";
  variables: string[];
  evalResultIndicatorString: string;
}

function QueryResultTable({
  results,
  kind,
  variables,
  evalResultIndicatorString,
}: QueryResultTableProps) {
  const [displayCount, setDisplayCount] = useState(MIN_DISPLAY_COUNT);

  if (results.length === 0) return null;

  const handleDisplayCountChange = (type: "more" | "less") => {
    const displayIncrement = DISPLAY_INCREMENT * (type === "more" ? 1 : -1);

    setDisplayCount((prev) =>
      Math.max(
        Math.min(prev + displayIncrement, results.length),
        MIN_DISPLAY_COUNT,
      ),
    );
  };

  const isCorrect = kind === "correct";

  const canShowLess = displayCount > MIN_DISPLAY_COUNT;
  const canShowMore = displayCount < results.length;

  const titleText = isCorrect ? "Correct results" : "Incorrect results";

  return (
    <>
      <div className={`query-result-table-title ${kind}`}>
        <span className="description">{titleText}</span>
        <span className="total-count">{`(${results.length} in total)`}</span>
      </div>
      <div className="query-result-table-scroll-wrapper">
        <Table
          className={`query-result-table ${kind}`}
          size="sm"
          hover
          bordered
        >
          <thead>
            <tr>
              {variables.map((v) => (
                <th key={v}>
                  <InlineMath>{v}</InlineMath>
                </th>
              ))}
              <th>
                <InlineMath>{evalResultIndicatorString}</InlineMath>
              </th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, displayCount).map((r) => (
              <tr key={r.valuation.join(",")}>
                {r.valuation.map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
                <td>
                  <FontAwesomeIcon
                    icon={isCorrect ? faCircleCheck : faCircleXmark}
                    color={isCorrect ? "var(--bs-success)" : "var(--bs-danger)"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className={`query-result-display-buttons ${kind}`}>
        <DisplayCountButton
          kind="less"
          onClick={handleDisplayCountChange}
          disabled={!canShowLess}
        />
        <DisplayCountButton
          kind="more"
          onClick={handleDisplayCountChange}
          disabled={!canShowMore}
        />
      </div>
    </>
  );
}

interface DisplayCountButtonProps {
  kind: "more" | "less";
  disabled: boolean;
  onClick: (kind: "more" | "less") => void;
}

function DisplayCountButton({
  kind,
  disabled,
  onClick,
}: DisplayCountButtonProps) {
  const buttonText = kind === "more" ? "Show more" : "Show less";

  return (
    <Button
      size="sm"
      variant="link"
      onClick={() => onClick(kind)}
      disabled={disabled}
    >
      {buttonText}
    </Button>
  );
}
