import { Button, Dropdown, Form, Stack, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addCondition,
  deleteIntervalEntry,
  updateInterval,
  type MainConditionEntry,
  type SubConditionEntry,
} from "./intervalViewSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export interface IntervalViewProps {
  tupleName: string;
  tupleArity: number;
  locked: boolean;
}

export default function IntervalView(_: IntervalViewProps) {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.present.intervalView);

  const handleDataChange = (idx: number, newEntry: MainConditionEntry) => {
    const newState = [...entries];
    newState[idx] = newEntry;

    dispatch(updateInterval(newState));
  };

  return (
    <Stack
      className="align-items-center justify-content-end"
      style={{ minHeight: "8rem" }}
    >
      <Table size="sm" borderless>
        <tbody>
          {entries.map((interval, idx) => (
            <IntervalEntryComponent
              idx={idx}
              key={idx}
              entry={interval}
              handleDataChange={handleDataChange}
            />
          ))}
        </tbody>
      </Table>

      {(entries.at(-1)?.mainCondition.type !== "wildcard" ||
        entries.at(-1)?.subConditions.length !== 0) && (
        <Dropdown>
          <Dropdown.Toggle
            as={Button}
            size="sm"
            className="m-2 flex-grow-0 btn-bd-light-outline"
          >
            Add condition
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {entries.at(-1)?.mainCondition.type !== "wildcard" && (
              <Dropdown.Item
                onClick={() =>
                  dispatch(addCondition({ conditionType: "value" }))
                }
              >
                Value
              </Dropdown.Item>
            )}

            <Dropdown.Item
              onClick={() =>
                dispatch(addCondition({ conditionType: "wildcard" }))
              }
            >
              Wildcard
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}
    </Stack>
  );
}

interface IntervalEntryComponentProps {
  idx: number;
  entry: MainConditionEntry;
  handleDataChange: (idx: number, newEntry: MainConditionEntry) => void;
}

function IntervalEntryComponent({
  handleDataChange,
  idx,
  entry,
}: IntervalEntryComponentProps) {
  const dispatch = useAppDispatch();

  if (entry.type === "condition") {
    const { value, variable, mainCondition: condition } = entry;

    const varDisabled = idx !== 0;

    const getUpdatedSubConditions = (
      entry: MainConditionEntry,
      subIdx: number,
      key: Exclude<keyof SubConditionEntry, "type">,
      value: string,
    ) => {
      const sub = { ...entry.subConditions[subIdx] };
      if (key === "condition") {
        sub[key] = { type: "value", value };
      } else {
        sub[key] = value;
      }

      const newSubs = [...entry.subConditions];
      newSubs[subIdx] = sub;
      console.log(newSubs);

      return newSubs;
    };

    return (
      <>
        <tr key="main">
          <td>
            <Form.Control
              type="text"
              size="sm"
              placeholder="value"
              value={value}
              onChange={(e) => {
                handleDataChange(idx, { ...entry, value: e.target.value });
              }}
            />
          </td>
          {condition.type === "value" ? (
            <>
              <td>if</td>
              <td>
                <Form.Control
                  disabled={varDisabled}
                  type="text"
                  size="sm"
                  value={variable}
                  placeholder="variable"
                  onChange={(e) => {
                    handleDataChange(idx, {
                      ...entry,
                      variable: e.target.value,
                    });
                  }}
                />
              </td>
              <td>=</td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  value={condition.value}
                  placeholder="condition"
                  onChange={(e) => {
                    handleDataChange(idx, {
                      ...entry,
                      mainCondition: { type: "value", value: e.target.value },
                    });
                  }}
                />
              </td>
            </>
          ) : entry.subConditions.length > 0 ? (
            <>
              <td>otherwise if</td>

              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  value={entry.subConditions[0].variable}
                  placeholder="variable"
                  onChange={(e) => {
                    handleDataChange(idx, {
                      ...entry,
                      subConditions: getUpdatedSubConditions(
                        entry,
                        0,
                        "variable",
                        e.target.value,
                      ),
                    });
                  }}
                />
              </td>
              <td>=</td>
              <td>
                {entry.subConditions[0].condition.type === "value" ? (
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="condition"
                    value={entry.subConditions[0].condition.value}
                    onChange={(e) => {
                      handleDataChange(idx, {
                        ...entry,
                        subConditions: getUpdatedSubConditions(
                          entry,
                          0,
                          "condition",
                          e.target.value,
                        ),
                      });
                    }}
                  />
                ) : (
                  "anything"
                )}
              </td>
            </>
          ) : (
            <td>otherwise</td>
          )}

          <td className="align-middle">
            <Button
              size="sm"
              className="btn-bd-light"
              onClick={() => dispatch(deleteIntervalEntry({ idx }))}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </td>
        </tr>

        {entry.mainCondition.type !== "wildcard" &&
          entry.subConditions?.map((subCondition, subIdx) =>
            subCondition.condition.type === "value" ? (
              <tr key={`sub-${subIdx}`}>
                <td></td>
                <td>and</td>
                <td>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="variable"
                    value={subCondition.variable}
                    onChange={(e) => {
                      handleDataChange(idx, {
                        ...entry,
                        subConditions: getUpdatedSubConditions(
                          entry,
                          subIdx,
                          "variable",
                          e.target.value,
                        ),
                      });
                    }}
                  />
                </td>
                <td>=</td>
                <td>
                  {subCondition.condition.type === "value" ? (
                    <Form.Control
                      type="text"
                      placeholder="condition"
                      size="sm"
                      value={subCondition.condition.value}
                      onChange={(e) => {
                        handleDataChange(idx, {
                          ...entry,
                          subConditions: getUpdatedSubConditions(
                            entry,
                            subIdx,
                            "condition",
                            e.target.value,
                          ),
                        });
                      }}
                    />
                  ) : (
                    "anything"
                  )}
                </td>

                <td className="align-middle">
                  <Button
                    size="sm"
                    className="btn-bd-light"
                    onClick={() =>
                      dispatch(
                        deleteIntervalEntry({ parentIdx: idx, idx: subIdx }),
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ) : (
              <tr key={`sub-${subIdx}`}>
                <td>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="value"
                    value={subCondition.value!}
                    onChange={(e) => {
                      handleDataChange(idx, {
                        ...entry,
                        subConditions: getUpdatedSubConditions(
                          entry,
                          subIdx,
                          "value",
                          e.target.value,
                        ),
                      });
                    }}
                  />
                </td>
                <td>for</td>
                <td>any other {subCondition.variable}</td>
                <td></td>
                <td></td>

                <td className="align-middle">
                  <Button size="sm" className="btn-bd-light">
                    <FontAwesomeIcon
                      icon={faTrash}
                      onClick={() =>
                        dispatch(
                          deleteIntervalEntry({ parentIdx: idx, idx: subIdx }),
                        )
                      }
                    />
                  </Button>
                </td>
              </tr>
            ),
          )}

        {entry.subConditions.length < 2 &&
          (entry.subConditions.length !== 1 ||
            entry.mainCondition.type !== "wildcard") && (
            <tr key="button">
              <td>
                <Dropdown>
                  <Dropdown.Toggle
                    as={Button}
                    size="sm"
                    className="m-2 flex-grow-0 btn-bd-light-outline"
                  >
                    Add sub-condition
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {entry.subConditions.length === 0 && (
                      <Dropdown.Item
                        onClick={() =>
                          dispatch(
                            addCondition({
                              parentIdx: idx,
                              conditionType: "value",
                            }),
                          )
                        }
                      >
                        Value
                      </Dropdown.Item>
                    )}

                    {entry.subConditions.length === 1 && (
                      <Dropdown.Item
                        onClick={() =>
                          dispatch(
                            addCondition({
                              parentIdx: idx,
                              conditionType: "wildcard",
                            }),
                          )
                        }
                      >
                        Wildcard
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          )}
        <tr className="divider-row">
          <td colSpan={100}>
            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "var(--bs-border-color)",
              }}
            />
          </td>
        </tr>
      </>
    );
  }

  return null;
}
