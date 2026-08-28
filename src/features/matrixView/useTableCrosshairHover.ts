import { useCallback, useRef } from "react";

const HOVERED_CLASS = "hovered";
const rowOffsetByHead = 1;

export default function useTableCrosshairHover() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const hoveredCell = useRef<Element | null>(null);
  const highlighted = useRef<Element[]>([]);

  const removeHighlight = useCallback(() => {
    highlighted.current.forEach((el) => el.classList.remove(HOVERED_CLASS));
    highlighted.current = [];
  }, []);

  const clearHover = useCallback(() => {
    hoveredCell.current = null;
    removeHighlight();
  }, [removeHighlight]);

  const handleTableHover = useCallback(
    (event: React.MouseEvent<HTMLTableElement>) => {
      const table = tableRef.current;

      if (!table) return;

      const cell = (event.target as HTMLElement).closest("td[data-col]");

      if (cell === hoveredCell.current) return;

      hoveredCell.current = cell;
      removeHighlight();

      if (!cell) return;

      const head = table.querySelector("thead");
      const body = table.querySelector("tbody");

      if (!head || !body) return;

      const headRow = head.children[0];

      if (!headRow) return;

      const { row, col } = (cell as HTMLElement).dataset;
      const colIdx = rowOffsetByHead + Number(col);
      const bodyRows = [...body.children];

      const toHighlight = [
        ...(row === undefined ? [] : [bodyRows[Number(row)]]),
        headRow.children[colIdx],
        ...bodyRows.map((rowEl) => rowEl.children[colIdx]),
      ];

      toHighlight.forEach((el) => el.classList.add(HOVERED_CLASS));
      highlighted.current = toHighlight;
    },
    [removeHighlight],
  );

  return { tableRef, handleTableHover, clearHover };
}
