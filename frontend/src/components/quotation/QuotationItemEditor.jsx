export default function QuotationItemEditor({ items, onChange, page4Overflow = false }) {
  function update(index, patch) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), description: "", unitPrice: "", quantity: "" }]);
  }

  return (
    <div className="item-editor">
      {items.length === 0 ? <div className="empty-items">No items added yet.</div> : null}
      {items.map((item, index) => (
        <div className="item-card" key={item.id || index}>
          <div className="item-head">
            <span>Item {index + 1}</span>
            <button type="button" className="btn-delete-item" onClick={() => remove(index)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete
            </button>
          </div>
          <div className="field">
            <label>Material Description</label>
            <textarea
              className="item-description"
              placeholder="Enter material description"
              value={item.description}
              onChange={(e) => update(index, { description: e.target.value })}
            />
          </div>
          <div className="item-metrics">
            <div className="field">
              <label>Unit Price (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Enter unit price"
                value={item.unitPrice}
                onChange={(e) => update(index, { unitPrice: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Quantity</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter quantity"
                value={item.quantity}
                onChange={(e) => update(index, { quantity: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      {page4Overflow ? (
        <div className="item-capacity-alert">Page 4 has reached its available item capacity.</div>
      ) : null}
      <button type="button" className="btn-add-item" onClick={addItem}>
        + Add Item
      </button>
    </div>
  );
}
