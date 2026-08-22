import "./QueryResults.css";

import { Button, CloseButton, Table } from "react-bootstrap";
import { InlineMath } from "react-katex";
import type { QueryResult } from "./queriesSlice";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { latex } from "../../shared/core/utils";

export interface QueryResultsProps {
  queryIdx: number;
  stale: boolean;
  results: QueryResult[];
  queryVariables: string[];
  onResultsClose: () => void;
}

export default function QueryResults({
  queryIdx,
  stale,
  results,
  queryVariables,
  onResultsClose,
}: QueryResultsProps) {
  const queryVariablesLen = queryVariables.length;
  const queryVarsEscaped = queryVariables.map((v) => latex().escape(v).get());
  const altVariables = queryVarsEscaped.map((v) => `${v}_1`);

  const correctAltVarsString =
    altVariables.length > 1 ? `(${altVariables})` : altVariables;
  const correctDomainPower =
    queryVarsEscaped.length > 1 ? `D^${queryVariablesLen}` : "D";
  const variablePairs = queryVarsEscaped
    .map((v, i) => `(\\mathsf{${v}}/ ${altVariables[i]})`)
    .join("");

  const queryResultString = `\\ \\{${correctAltVarsString} \\in ${correctDomainPower} \\mid \\mathcal{M} \\models  \\psi_${queryIdx + 1}[e${variablePairs}]\\}`;

  return (
    <div className="query-result-container">
      <div className="query-result-title">
        <span>
          Query results for
          <InlineMath>{queryResultString}</InlineMath>
        </span>

        <CloseButton onClick={onResultsClose} />
      </div>

      <QueryResultTable
        stale={stale}
        results={results}
        variables={altVariables}
      />
    </div>
  );
}

const MIN_DISPLAY_COUNT = 6;
const DISPLAY_INCREMENT = 10;

interface QueryResultTableProps {
  results: QueryResult[];
  stale: boolean;
  variables: string[];
}

function QueryResultTable({
  results,
  stale,
  variables,
}: QueryResultTableProps) {
  const [displayCount, setDisplayCount] = useState(MIN_DISPLAY_COUNT);
  const [shownResults, setShownResults] = useState(results);

  if (shownResults !== results) {
    setShownResults(results);
    setDisplayCount(MIN_DISPLAY_COUNT);
  }

  const handleDisplayCountChange = (type: "more" | "less") => {
    const displayIncrement = DISPLAY_INCREMENT * (type === "more" ? 1 : -1);

    setDisplayCount((prev) =>
      Math.max(
        Math.min(prev + displayIncrement, results.length),
        MIN_DISPLAY_COUNT,
      ),
    );
  };

  const didFindResults = results.length !== 0;

  const canShowLess = displayCount > MIN_DISPLAY_COUNT;
  const canShowMore = displayCount < results.length;

  const getTitleComponent = () => {
    if (stale)
      return (
        <>
          <FontAwesomeIcon icon={faWarning} />
          Showing possibly outdated results. Press the query button again to
          refresh.
        </>
      );

    if (didFindResults)
      return (
        <>
          Found <strong>{results.length} results</strong>.
        </>
      );

    return "No results found.";
  };

  const titleClass = stale ? "error" : didFindResults ? "success" : "danger";

  return (
    <>
      <div className={`query-result-table-title ${titleClass}`}>
        <span className="description">{getTitleComponent()}</span>
      </div>

      {results.length > 0 && (
        <div className="query-result-table-scroll-wrapper">
          <Table
            className={`query-result-table ${stale ? "stale" : ""}`}
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
              </tr>
            </thead>

            <tbody>
              {results.slice(0, displayCount).map((valuation) => (
                <tr key={valuation.join(",")}>
                  {valuation.map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {results.length > MIN_DISPLAY_COUNT && (
        <div className="query-result-display-buttons">
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
      )}
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
