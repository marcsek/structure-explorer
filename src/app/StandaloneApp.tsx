import usePreset from "../presets/usePreset";
import App from "./App";

export default function StandaloneApp() {
  usePreset();

  return <App />;
}
