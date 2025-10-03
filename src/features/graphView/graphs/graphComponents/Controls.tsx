import { Controls as XYControls } from "@xyflow/react";

export default function Controls() {
  return (
    <XYControls
      orientation="horizontal"
      fitViewOptions={{ padding: "50px", duration: 300 }}
    />
  );
}
