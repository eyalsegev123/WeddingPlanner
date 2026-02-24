import React, { useEffect, useState } from "react";

import type { CollapseSignal } from "../../types/wedding";

interface Props {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapseSignal?: CollapseSignal;
}

export default function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
  collapseSignal,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    if (!collapseSignal?.mode) return;
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
