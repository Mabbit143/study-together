import { StartPanel } from "./start-panel";
import { ContinuePanel } from "./continue-panel";
import { StudyPaths } from "./study-paths";

export function Landing() {
  return (
    <main className="landing">
      <StartPanel />
      <StudyPaths />
      <ContinuePanel />
      <aside className="landing-note" aria-label="How the demo works">
        <p className="eyebrow">Built for clarity</p>
        <p>Every contribution is named, every source is cited, and every shared moment can be read as captions.</p>
      </aside>
    </main>
  );
}
