import { Stack } from "react-bootstrap";
import { InlineMath } from "react-katex";
import { ForwardSlashIcon } from "../../components_helper/CustomIcons";

export interface EditorTitleProps {
  base: string;
  editor: string;
  style?: "flat" | "background";
}

export default function EditorTitle({
  base,
  editor,
  style = "background",
}: EditorTitleProps) {
  return (
    <Stack
      direction="horizontal"
      className={`${style === "background" ? "input-group-text" : ""} flex-shrink-0 align-items-center`}
      gap={2}
    >
      <span className="text-body-secondary fw-light">
        <InlineMath>{base}</InlineMath>
      </span>

      <ForwardSlashIcon className="text-body-secondary" size="1rem" />
      <span className="text-body text-capitalize fw-medium">{editor}</span>
    </Stack>
  );
}
