import React, { useEffect, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import type { CollapseSignal, WeddingData } from "../../types/wedding";

interface Props {
  data: WeddingData;
  onApplyJson: (text: string) => { error: string | null };
  onResetData: (confirmed: boolean) => void;
  onExportJson: () => void;
  collapseSignal?: CollapseSignal;
}

export default function JsonSection({
  data,
  onApplyJson,
  onResetData,
  onExportJson,
  collapseSignal,
}: Props) {
  const [text, setText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  function handleApply() {
    const result = onApplyJson(text);
    setJsonError(result.error);
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onResetData(true);
    setConfirmReset(false);
  }

  return (
    <CollapsibleSection title="JSON Store" defaultCollapsed collapseSignal={collapseSignal}>
      <p className="muted">
        This is the full data source. Personalization, tasks, vendors, guests, seating, and budget
        are all persisted here.
      </p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} />

      {jsonError && <p className="muted" style={{ color: "var(--danger)" }}>{jsonError}</p>}

      <div className="button-row">
        <button className="btn" type="button" onClick={handleApply}>
          Apply JSON
        </button>
        <button className="btn" type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button className="btn danger" type="button" onClick={handleReset}>
          {confirmReset ? "Confirm Reset?" : "Reset Data"}
        </button>
        {confirmReset && (
          <button
            className="btn secondary"
            type="button"
            onClick={() => setConfirmReset(false)}
          >
            Cancel
          </button>
        )}
      </div>
    </CollapsibleSection>
  );
}
