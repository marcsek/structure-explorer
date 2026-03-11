import Card from "react-bootstrap/Card";
import Formula from "../../model/formula/Formula";
import GameControl from "./GameControls";
import GameHistory from "./GameHistory";

interface Props {
  id: number;
  guess: boolean;
  originalFormula: Formula;
}

export default function GameComponent({ id }: Props) {
  return (
    <>
      <Card className="mb-3 mt-3 h-100 game-container border">
        <Card.Body
          className="d-flex flex-column overflow-y-auto text-break vw-25"
          style={{
            maxHeight: "33vh",
            overflowY: "auto",
            fontSize: "0.875rem",
            position: "relative",
          }}
        >
          <GameHistory id={id} />
        </Card.Body>
        <GameControl id={id} />
      </Card>
    </>
  );
}
