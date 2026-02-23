import React, { useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

export default function JsonSection({ data, onApplyJson, onResetData, onExportJson, collapseSignal }) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  return (
    <CollapsibleSection title="JSON Store" defaultCollapsed collapseSignal={collapseSignal}>
      <p className="muted">
        This is the full data source. Personalization, tasks, vendors, guests, seating, and budget are all persisted here.
      </p>

      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={18} />

      <div className="button-row">
        <button className="btn" onClick={() => onApplyJson(text)}>
          Apply JSON
        </button>
        <button className="btn" onClick={onExportJson}>
          Export JSON
        </button>
        <button className="btn danger" onClick={onResetData}>
          Reset Data
        </button>
      </div>
    </CollapsibleSection>
  );
}
