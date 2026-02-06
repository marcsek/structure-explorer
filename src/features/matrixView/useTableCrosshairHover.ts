import { useCallback, useRef } from "react";

const HOVERED_CLASS = "hovered";
const rowOffsetByHead = 1;

export default function useTableCrosshairHover() {
  const tableRef = useRef<HTMLTableElement | null>(null);

  const handleCellHover = useCallback((row: number, col: number) => {
    const table = tableRef.current;

    if (!table) return;

    table
      .querySelectorAll(`.${HOVERED_CLASS}`)
      .forEach((el) => el.classList.remove(HOVERED_CLASS));

    if (row === -1 && col === -1) return;

    const head = table.querySelector("thead");
    const body = table.querySelector("tbody");

    if (!head || !body) return;

    const headRow = head.children[0];

    if (!headRow) return;

    const bodyRows = [...body.children];
    bodyRows[row].classList.add(HOVERED_CLASS);

    if (col !== -1) {
      headRow.children[rowOffsetByHead + col].classList.add(HOVERED_CLASS);
      bodyRows.forEach((rowEl) =>
        rowEl.children[rowOffsetByHead + col].classList.add(HOVERED_CLASS),
      );
    }
  }, []);

  return { tableRef, handleCellHover };
}
