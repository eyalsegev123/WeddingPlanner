import React, { useEffect, useState } from "react";

export default function Header({ meta, onMetaChange, stats }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ILS"
  });

  const daysLabel =
    typeof stats.daysToWedding === "number"
      ? stats.daysToWedding > 0
        ? `${stats.daysToWedding} days left`
        : stats.daysToWedding === 0
          ? "Wedding day is today"
          : `${Math.abs(stats.daysToWedding)} days since wedding`
      : "Set wedding date";

  useEffect(() => {
    if (!settingsOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  return (
    <header className="card header">
      <div className="hero-head">
        <div>
          <p className="kicker">Wedding Operations Dashboard</p>
          <h1>{meta.title}</h1>
          <p className="muted">Planning for {meta.partnerOne} & {meta.partnerTwo}</p>
          <p className="muted">{daysLabel}</p>
        </div>
        <button className="btn" type="button" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
      </div>

      <div className="stats-grid">
        <article>
          <p className="muted">Tasks Completion</p>
          <strong>{stats.tasksCompletion}%</strong>
        </article>
        <article>
          <p className="muted">RSVP Completion</p>
          <strong>{stats.rsvpCompletion}%</strong>
        </article>
        <article>
          <p className="muted">Vendors Booked</p>
          <strong>{stats.bookedVendors}</strong>
        </article>
        <article>
          <p className="muted">Vendors Shortlisted</p>
          <strong>{stats.shortlistedVendors}</strong>
        </article>
        <article>
          <p className="muted">Tasks Open</p>
          <strong>{stats.openTasks}</strong>
        </article>
        <article>
          <p className="muted">Seats Open</p>
          <strong>{stats.openSeats}</strong>
        </article>
        <article>
          <p className="muted">Budget Planned</p>
          <strong>{money.format(stats.budgetPlanned || 0)}</strong>
        </article>
        <article>
          <p className="muted">Budget Left</p>
          <strong>{money.format(stats.budgetLeft || 0)}</strong>
        </article>
      </div>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal-card settings-modal" role="dialog" aria-modal="true" aria-label="Wedding settings" onClick={(event) => event.stopPropagation()}>
            <div className="section-header">
              <h2>Wedding Settings</h2>
              <button className="btn danger" type="button" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>

            <div className="meta-grid settings-grid">
              <label>
                Project Name
                <input value={meta.title} onChange={(event) => onMetaChange("title", event.target.value)} />
              </label>
              <label>
                Planner Name
                <input value={meta.plannerName} onChange={(event) => onMetaChange("plannerName", event.target.value)} />
              </label>
              <label>
                Partner 1
                <input value={meta.partnerOne} onChange={(event) => onMetaChange("partnerOne", event.target.value)} />
              </label>
              <label>
                Partner 2
                <input value={meta.partnerTwo} onChange={(event) => onMetaChange("partnerTwo", event.target.value)} />
              </label>
              <label>
                Side Label 1
                <input value={meta.sideOneLabel} onChange={(event) => onMetaChange("sideOneLabel", event.target.value)} />
              </label>
              <label>
                Side Label 2
                <input value={meta.sideTwoLabel} onChange={(event) => onMetaChange("sideTwoLabel", event.target.value)} />
              </label>
              <label>
                Wedding Date
                <input type="date" value={meta.weddingDate} onChange={(event) => onMetaChange("weddingDate", event.target.value)} />
              </label>
              <label>
                Venue
                <input value={meta.venue} onChange={(event) => onMetaChange("venue", event.target.value)} />
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
