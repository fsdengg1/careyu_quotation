export default function StatePanel({ error, children }) {
  return (
    <div className="state-panel" role="status">
      {error ? (
        <p className="alert">{error}</p>
      ) : (
        <>
          <span className="spinner" />
          <p>{children}</p>
        </>
      )}
    </div>
  );
}
