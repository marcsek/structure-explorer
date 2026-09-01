import { batch } from "react-redux";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export interface Point {
  x: number;
  y: number;
}

interface ColorDragState {
  pointerId: number;
  draggedIndex: number;
  startSlot: number;
  order: number[];
  grab: Point;
  offset: Point;
}

interface ColorDragOptions {
  count: number;
  listRef: RefObject<HTMLUListElement>;
  onReorder: (from: number, to: number) => void;
  onDragStart: () => void;
}

const noOffset: Point = { x: 0, y: 0 };

export default function useColorDrag({
  count,
  listRef,
  onReorder,
  onDragStart,
}: ColorDragOptions) {
  const dragRef = useRef<ColorDragState | null>(null);
  const [drag, setDrag] = useState<ColorDragState | null>(null);

  const updateDrag = useCallback((next: ColorDragState | null) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const order = drag?.order ?? Array.from({ length: count }, (_, i) => i);

  const startDrag = (e: ReactPointerEvent<HTMLElement>, slot: number) => {
    if (dragRef.current || e.button !== 0) return;

    const center = centerOf(e.currentTarget);

    onDragStart();
    updateDrag({
      pointerId: e.pointerId,
      draggedIndex: order[slot],
      startSlot: slot,
      order,
      grab: { x: e.clientX - center.x, y: e.clientY - center.y },
      offset: { x: 0, y: 0 },
    });
  };

  const dragging = drag !== null;

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const prev = dragRef.current;
      const list = listRef.current;
      if (!prev || !list || e.pointerId !== prev.pointerId) return;

      const slot = prev.order.indexOf(prev.draggedIndex);
      const centers = Array.from(list.children).slice(0, count).map(centerOf);
      const dragged = {
        x: e.clientX - prev.grab.x,
        y: e.clientY - prev.grab.y,
      };

      const overList = containsPoint(list.getBoundingClientRect(), {
        x: e.clientX,
        y: e.clientY,
      });
      const target = overList ? nearestSlot(centers, dragged) : slot;

      updateDrag({
        ...prev,
        order: slot === target ? prev.order : move(prev.order, slot, target),
        offset: {
          x: dragged.x - centers[target].x,
          y: dragged.y - centers[target].y,
        },
      });
    };

    const onEnd = (e: PointerEvent) => {
      const prev = dragRef.current;
      if (!prev || e.pointerId !== prev.pointerId) return;

      const slot = prev.order.indexOf(prev.draggedIndex);

      batch(() => {
        if (slot !== prev.startSlot) onReorder(prev.startSlot, slot);
        updateDrag(null);
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [dragging, count, listRef, onReorder, updateDrag]);

  return {
    order,
    draggedIndex: drag?.draggedIndex ?? null,
    offset: drag?.offset ?? noOffset,
    startDrag,
  };
}

function centerOf(item: Element): Point {
  const rect = item.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function nearestSlot(centers: Point[], point: Point) {
  return centers.reduce(
    (nearest, center, slot) =>
      distance(center, point) < distance(centers[nearest], point)
        ? slot
        : nearest,
    0,
  );
}

function containsPoint(rect: DOMRect, point: Point) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function move(order: number[], from: number, to: number) {
  const reordered = [...order];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return reordered;
}
