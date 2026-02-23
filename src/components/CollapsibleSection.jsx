import React, { useState } from "react";
import { useEffect } from "react";

export default function CollapsibleSection({ title, children, defaultCollapsed = false, collapseSignal }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    if (!collapseSignal?.mode) {
      return;
    }
    setCollapsed(collapseSignal.mode === "collapse");
  }, [collapseSignal]);

  return (
    <section className="card section">
      <div className="section-header">
        <h2>{title}</h2>
        <button
          className={collapsed ? "collapse-toggle collapsed" : "collapse-toggle"}
          type="button"
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <span>▾</span>
        </button>
      </div>

      {!collapsed && <div className="section-body">{children}</div>}
    </section>
  );
}
