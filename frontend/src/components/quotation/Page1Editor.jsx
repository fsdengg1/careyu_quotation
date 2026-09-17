function upper(value) {
  return String(value || "").toUpperCase();
}

export default function Page1Editor({ form, customers, onChange }) {
  function patch(partial) {
    onChange(partial);
  }

  function selectCustomer(id) {
    const customer = customers.find((row) => row.id === id);
    if (!customer) {
      patch({ customerId: "" });
      return;
    }
    patch({
      customerId: customer.id,
      clientName: upper(customer.contactPerson || customer.customerName),
      clientCompany: upper(customer.companyName),
    });
  }

  return (
    <div className="page-editor">
      <header className="page-editor-head">
        <p>PAGE 1</p>
        <h2>Quotation Cover</h2>
      </header>
      <div className="page-editor-fields page1-upper">
        <div className="grid-2">
          <div className="field">
            <label>Quotation Number</label>
            <input
              value={form.quotationNumber}
              placeholder="Enter quotation number"
              onChange={(e) => patch({ quotationNumber: upper(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={form.quotationDate}
              placeholder="DD-MM-YYYY"
              onChange={(e) => patch({ quotationDate: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Project Name</label>
          <input
            value={form.projectName}
            placeholder="Enter project name"
            onChange={(e) => patch({ projectName: upper(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Project Location</label>
          <input
            value={form.projectLocation}
            placeholder="Enter project location"
            onChange={(e) => patch({ projectLocation: upper(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Existing Customer</label>
          <select value={form.customerId || ""} onChange={(e) => selectCustomer(e.target.value)}>
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.companyName}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Client Name</label>
          <input
            value={form.clientName}
            placeholder="Enter client name"
            onChange={(e) => patch({ clientName: upper(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Client Company Name</label>
          <input
            value={form.clientCompany}
            placeholder="Enter client company name"
            onChange={(e) => patch({ clientCompany: upper(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
