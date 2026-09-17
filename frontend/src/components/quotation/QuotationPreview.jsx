import { useLayoutEffect, useRef, useState } from "react";
import { calculateQuotation } from "../../utils/calculations";
import { DEFAULT_COMPANY } from "../../data/staticContent";
import QuotationPage1 from "./QuotationPage1";
import QuotationPage2 from "./QuotationPage2";
import QuotationPage3 from "./QuotationPage3";
import QuotationPage4 from "./QuotationPage4";
import QuotationPage5 from "./QuotationPage5";

function PreviewSheet({ pageNumber, scale, overflowWarning, children }) {
  return (
    <div className="preview-sheet">
      <div className="preview-page-label no-print">PAGE {pageNumber} OF 5</div>
      {overflowWarning ? <div className="preview-overflow-alert no-print">{overflowWarning}</div> : null}
      <div
        className="preview-sheet-stage"
        style={{
          width: `calc(210mm * ${scale})`,
          height: `calc(297mm * ${scale})`,
          ["--preview-scale"]: scale,
        }}
      >
        <div
          className={`quotation-page page-${pageNumber}`}
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function QuotationPreview({
  quotation,
  mode = "preview",
  scale = 1,
  visiblePage = "all",
  onPage4Overflow,
}) {
  const company = { ...DEFAULT_COMPANY, ...(quotation.companySnapshot || {}) };
  const totals = calculateQuotation(
    quotation.items,
    quotation.freight,
    quotation.installationCharge,
    quotation.gstPercentage,
    quotation.gstAsExtra
  );
  const page4Ref = useRef(null);
  const [page4Overflow, setPage4Overflow] = useState(false);

  useLayoutEffect(() => {
    const node = page4Ref.current;
    if (!node) return undefined;

    function measure() {
      const overflowing = node.scrollHeight > node.clientHeight + 2;
      setPage4Overflow(overflowing);
      if (onPage4Overflow) onPage4Overflow(overflowing);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [quotation.items, quotation.terms, totals.gstPercentage, totals.gstAsExtra, totals.grandTotal, mode, onPage4Overflow]);

  const pages = [
    <QuotationPage1 key="p1" quotation={quotation} company={company} />,
    <QuotationPage2 key="p2" company={company} />,
    <QuotationPage3 key="p3" company={company} />,
    <QuotationPage4
      key="p4"
      quotation={quotation}
      totals={totals}
      company={company}
      contentRef={mode !== "print" && (visiblePage === "all" || visiblePage === 4) ? page4Ref : undefined}
    />,
    <QuotationPage5 key="p5" quotation={quotation} company={company} />,
  ];

  if (mode === "print") {
    return (
      <div className="quotation-document quotation-document--print q-root">
        {pages.map((page, index) => (
          <div className={`quotation-page page-${index + 1}`} key={index}>
            {page}
          </div>
        ))}
      </div>
    );
  }

  const overflowWarning = page4Overflow
    ? "Too many items for Page 4. Please reduce the number of items or use continuation page."
    : null;

  const indexes =
    visiblePage === "all" || mode === "print" ? [0, 1, 2, 3, 4] : [Number(visiblePage) - 1];

  return (
    <div className="quotation-document quotation-document--preview q-root">
      {indexes.map((index) => (
        <PreviewSheet
          key={index}
          pageNumber={index + 1}
          scale={scale}
          overflowWarning={index === 3 ? overflowWarning : null}
        >
          {pages[index]}
        </PreviewSheet>
      ))}
    </div>
  );
}
