import Link from "next/link";

export function StartPanel() {
  return (
    <section aria-labelledby="start-heading" className="start-panel">
      <p className="eyebrow">A small, supported room</p>
      <h1 id="start-heading">Study together, at your pace.</h1>
      <p>
        Read closely with a clear source, live captions, a shared board, and helpful AI labels that never pretend to be people.
      </p>
      <Link className="primary-link" href="/?room=old-english-demo">
        Enter the demo room
      </Link>
    </section>
  );
}
