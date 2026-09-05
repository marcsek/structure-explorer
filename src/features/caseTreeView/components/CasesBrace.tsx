const capPath = "M13 0C9 1.5 6 3.5 6 8H8C8 4.5 10 2.5 13 1Z";

export default function CasesBrace() {
  return (
    <span className="cases-brace" aria-hidden="true">
      <svg viewBox="0 0 16 8" focusable="false">
        <path d={capPath} />
      </svg>
      <span className="cases-brace-stem" />
      <svg viewBox="0 0 16 16" focusable="false">
        <path d="M6 0C6 5 4 7 1 7.5V8.5C4 9 6 11 6 16H8C8 11 6 8.5 3 8C6 7.5 8 5 8 0Z" />
      </svg>
      <span className="cases-brace-stem" />
      <svg viewBox="0 0 16 8" focusable="false">
        <path d={capPath} transform="translate(0 8) scale(1 -1)" />
      </svg>
    </span>
  );
}
