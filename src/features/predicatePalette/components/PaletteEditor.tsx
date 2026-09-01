import "./PaletteEditor.css";

import { Button, Overlay, Popover } from "react-bootstrap";
import { HexColorInput, HexColorPicker } from "react-colorful";
import {
  faAngleDown,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { useAppDispatch } from "../../../app/hooks";
import {
  addCustomPaletteColor,
  removeCustomPaletteColor,
  reorderCustomPaletteColors,
  setCustomPaletteColor,
} from "../predicatePaletteSlice";
import PaletteTitle from "./PaletteTitle";
import useColorDrag, { type Point } from "./useColorDrag";

interface PaletteEditorProps {
  colors: string[];
}

interface OpenColor {
  index: number;
  anchor: HTMLElement;
  trigger: HTMLElement;
}

export default function PaletteEditor({ colors }: PaletteEditorProps) {
  const dispatch = useAppDispatch();
  const editorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<OpenColor | null>(null);

  const closeEditing = useCallback(() => {
    setOpen(null);
  }, []);

  const openEditing = useCallback(
    (index: number, anchor: HTMLElement, trigger: HTMLElement) => {
      setOpen({ index, anchor, trigger });
    },
    [],
  );

  const reorderColors = useCallback(
    (from: number, to: number) => {
      dispatch(reorderCustomPaletteColors({ from, to }));
    },
    [dispatch],
  );

  const pickColor = (index: number, color: string) => {
    dispatch(setCustomPaletteColor({ index, color }));
  };

  const removeColor = (index: number) => {
    closeEditing();
    dispatch(removeCustomPaletteColor(index));
  };

  const addColor = () => {
    closeEditing();
    dispatch(addCustomPaletteColor());
  };

  return (
    <div className="predicate-palette-editor" ref={editorRef}>
      <PaletteTitle
        title="Palette Editor"
        subtitle="Drag a ring to reorder it. Click its center to edit."
      />

      <PaletteColorList
        colors={colors}
        editing={open?.index ?? null}
        onEdit={openEditing}
        onCloseEdit={closeEditing}
        onReorder={reorderColors}
        onAdd={addColor}
      />

      {open && (
        <PaletteColorPopover
          color={colors[open.index]}
          anchor={open.anchor}
          trigger={open.trigger}
          container={editorRef}
          removable={colors.length > 1}
          onClose={closeEditing}
          onPick={(color) => pickColor(open.index, color)}
          onRemove={() => removeColor(open.index)}
        />
      )}
    </div>
  );
}

interface PaletteColorListProps {
  colors: string[];
  editing: number | null;
  onEdit: (index: number, swatch: HTMLElement, trigger: HTMLElement) => void;
  onCloseEdit: () => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}

function PaletteColorList({
  colors,
  editing,
  onEdit,
  onCloseEdit,
  onReorder,
  onAdd,
}: PaletteColorListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { order, draggedIndex, offset, startDrag } = useColorDrag({
    count: colors.length,
    listRef,
    onReorder,
    onDragStart: onCloseEdit,
  });

  const keys = colorKeys(order.map((index) => colors[index]));

  const moveWithKeyboard = (
    e: ReactKeyboardEvent<HTMLButtonElement>,
    slot: number,
  ) => {
    if (draggedIndex !== null) return;

    const step =
      e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : undefined;
    if (step === undefined) return;

    const target = slot + step;
    if (target < 0 || target >= colors.length) return;

    e.preventDefault();
    onCloseEdit();
    onReorder(slot, target);
  };

  return (
    <ul className="palette-editor-color-list" ref={listRef}>
      {order.map((index, slot) => (
        <PaletteColorItem
          key={keys[slot]}
          color={colors[index]}
          dragged={draggedIndex === index}
          offset={offset}
          editing={editing === index}
          onDragStart={(e) => startDrag(e, slot)}
          onEdit={(swatch, trigger) =>
            editing === index ? onCloseEdit() : onEdit(index, swatch, trigger)
          }
          onKeyDown={(e) => moveWithKeyboard(e, slot)}
        />
      ))}

      <li key="add-color">
        <Button
          className="btn-bd-light-outline predicate-palette-add-color-button"
          onClick={onAdd}
        >
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </li>
    </ul>
  );
}

interface PaletteColorItemProps {
  color: string;
  dragged: boolean;
  offset: Point;
  editing: boolean;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onEdit: (swatch: HTMLElement, trigger: HTMLElement) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
}

function PaletteColorItem({
  color,
  dragged,
  offset,
  editing,
  onDragStart,
  onEdit,
  onKeyDown,
}: PaletteColorItemProps) {
  const ringRef = useRef<HTMLDivElement>(null);

  return (
    <li
      className={`palette-editor-color-item ${dragged ? "dragging" : ""}`}
      style={{ color }}
    >
      {dragged && (
        <div className="palette-editor-color-picker palette-editor-color-ghost" />
      )}

      <div
        ref={ringRef}
        className={`palette-editor-color-picker ${dragged ? "dragged" : ""} ${editing ? "editing" : ""}`}
        onPointerDown={onDragStart}
        style={{
          transform: dragged
            ? `translate(${offset.x}px, ${offset.y}px)`
            : undefined,
        }}
      >
        <button
          className="palette-color-picker-edit-icon-container"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (ringRef.current) onEdit(ringRef.current, e.currentTarget);
          }}
          onKeyDown={onKeyDown}
        >
          <FontAwesomeIcon icon={faAngleDown} size="sm" />
        </button>
      </div>
    </li>
  );
}

interface PaletteColorPopoverProps {
  color: string;
  anchor: HTMLElement;
  trigger: HTMLElement;
  container: RefObject<HTMLDivElement>;
  removable: boolean;
  onClose: () => void;
  onPick: (color: string) => void;
  onRemove: () => void;
}

function PaletteColorPopover({
  color,
  anchor,
  trigger,
  container,
  removable,
  onClose,
  onPick,
  onRemove,
}: PaletteColorPopoverProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      e.stopPropagation();
      onClose();

      trigger.focus();
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [trigger, onClose]);

  return (
    <Overlay
      show
      target={anchor}
      container={container}
      placement="bottom-start"
      onHide={onClose}
      transition={false}
      rootClose
      flip
    >
      {({ className, ...props }) => (
        <Popover
          {...props}
          className={`${className ?? ""} palette-editor-color-popover`}
        >
          <Popover.Body>
            <HexColorPicker color={color} onChange={onPick} />
            <HexColorInput
              className="palette-editor-color-hex"
              color={color}
              onChange={onPick}
              prefixed
            />
            <Button
              size="sm"
              variant="outline-danger"
              className="palette-delete-color-button"
              disabled={!removable}
              onClick={onRemove}
            >
              <FontAwesomeIcon icon={faTrash} size="sm" />
              Remove color
            </Button>
          </Popover.Body>
        </Popover>
      )}
    </Overlay>
  );
}

function colorKeys(ordered: string[]) {
  const seen = new Map<string, number>();

  return ordered.map((color) => {
    const repeat = (seen.get(color) ?? 0) + 1;
    seen.set(color, repeat);
    return `${color}#${repeat}`;
  });
}
