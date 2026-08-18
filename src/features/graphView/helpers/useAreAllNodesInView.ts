import { useReactFlow } from "@xyflow/react";
import { useCallback, type RefObject } from "react";

export function useAreAllNodesInView(
  flowWrapperRef: RefObject<HTMLDivElement | null>,
  margin: number = 0,
) {
  const reactFlow = useReactFlow();

  return useCallback(() => {
    const flowWrapperElement = flowWrapperRef.current;

    if (!flowWrapperElement) return false;

    const nodes = reactFlow.getNodes();
    const { x, y, zoom } = reactFlow.getViewport();
    const { clientWidth: width, clientHeight: height } = flowWrapperElement;

    const viewportLeft = -x / zoom + margin;
    const viewportTop = -y / zoom + margin;
    const viewportRight = viewportLeft + (width - 2 * margin) / zoom;
    const viewportBottom = viewportTop + (height - 2 * margin) / zoom;

    return nodes.every((node) => {
      const internal = reactFlow.getInternalNode(node.id);

      const nodeLeft = internal?.internals.positionAbsolute.x ?? node.position.x;
      const nodeTop = internal?.internals.positionAbsolute.y ?? node.position.y;
      const nodeRight = nodeLeft + (internal?.measured.width ?? 0);
      const nodeBottom = nodeTop + (internal?.measured.height ?? 0);

      const withinHorizontal =
        nodeLeft >= viewportLeft && nodeRight <= viewportRight;
      const withinVertical =
        nodeTop >= viewportTop && nodeBottom <= viewportBottom;

      return withinHorizontal && withinVertical;
    });
  }, [reactFlow, flowWrapperRef, margin]);
}
