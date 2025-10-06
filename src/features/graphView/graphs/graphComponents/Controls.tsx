import { Controls as XYControls } from "@xyflow/react";

export default function Controls({
  showInteractive = true,
  onInteractiveChange,
}: {
  showInteractive?: boolean;
  onInteractiveChange?: (change: boolean) => void;
}) {
  return (
    <XYControls
      orientation="horizontal"
      fitViewOptions={{ padding: "50px", duration: 300 }}
      showInteractive={showInteractive}
      onInteractiveChange={onInteractiveChange}
    />
  );
}
