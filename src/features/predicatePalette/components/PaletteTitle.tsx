import "./PaletteTitle.css";

interface PaletteTitleProps {
  id?: string;
  title: string;
  subtitle?: string;
}

export default function PaletteTitle({
  id,
  title,
  subtitle,
}: PaletteTitleProps) {
  return (
    <hgroup className="predicate-palette-title-group">
      <h2 className="predicate-palette-title" id={id}>
        {title}
      </h2>

      {subtitle && <p className="predicate-palette-subtitle">{subtitle}</p>}
    </hgroup>
  );
}
