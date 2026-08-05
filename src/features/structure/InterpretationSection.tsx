import { Stack } from "react-bootstrap";
import { useAppSelector } from "../../app/hooks";
import { selectSymbolsClash } from "../language/languageSlice";
import type { RootState } from "../../app/store";
import type { Validated } from "../../shared/core/redux";

interface InterpretationSectionProps<SymbolData> {
  sectionTitle: string;
  renderSymbol: (symbolData: SymbolData) => React.ReactNode;
  selectSymbols: (state: RootState) => Validated<Iterable<SymbolData>>;
}

export default function InterpretationSection<T>({
  renderSymbol,
  sectionTitle,
  selectSymbols,
}: InterpretationSectionProps<T>) {
  const symbolsClash = useAppSelector(selectSymbolsClash);
  const { parsed, error } = useAppSelector(selectSymbols);
  const symbols = [...parsed];

  if (symbolsClash || error || symbols.length === 0) return null;

  return (
    <div className="structure-component-section">
      <h6 className="fw-normal lh-base">{sectionTitle}</h6>

      <Stack gap={3}>
        {symbols.map((symbolData) => renderSymbol(symbolData))}
      </Stack>
    </div>
  );
}
