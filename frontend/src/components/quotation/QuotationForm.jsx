import Page1Editor from "./Page1Editor";
import Page2Editor from "./Page2Editor";
import Page3Editor from "./Page3Editor";
import Page4Editor from "./Page4Editor";
import Page5Editor from "./Page5Editor";

export default function QuotationForm({
  form,
  setForm,
  customers,
  totals,
  currentPage,
  page4Overflow = false,
  error,
  message,
}) {
  function patch(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  const editors = {
    1: (
      <Page1Editor
        form={form}
        customers={customers}
        onChange={patch}
      />
    ),
    2: <Page2Editor />,
    3: <Page3Editor />,
    4: <Page4Editor form={form} totals={totals} page4Overflow={page4Overflow} onChange={patch} />,
    5: <Page5Editor form={form} onChange={patch} />,
  };

  return (
    <div className="form-pane">
      {error ? <div className="alert">{error}</div> : null}
      {message ? <div className="success">{message}</div> : null}
      {editors[currentPage] || null}
    </div>
  );
}
