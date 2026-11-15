export function StartPanel({ onCreate }: { onCreate(): void }) {
  return (
    <section aria-labelledby="start-heading" className="start-panel">
      <p className="eyebrow">A small, supported room</p>
      <h1 id="start-heading">Study together, at your pace.</h1>
      <p>
        Read closely with a clear source, live captions, a shared board, and helpful AI labels that never pretend to be people.
      </p>
      <button className="primary-link" onClick={onCreate} type="button">Create new session</button>
    </section>
  );
}
