import { InlineMath } from "react-katex";

export function BubbleList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <>
      {title}
      <ul className="m-0 ps-4">
        {items.map((item) => (
          <li className="pt-1 secondary-marker" key={item}>
            <InlineMath>{item}</InlineMath>
          </li>
        ))}
      </ul>
    </>
  );
}
