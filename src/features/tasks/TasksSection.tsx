import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
import { TASK_PRIORITIES, TASK_STATUSES } from "../../constants/enums";
import type { CollapseSignal, Task, TaskPriority, TaskStatus } from "../../types/wedding";

interface Props {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id">) => void;
  onPatchTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

const STATUS_BG: Record<TaskStatus, string> = {
  Open: "#e8f4fd",
  "In Progress": "#fff4e0",
  Blocked: "#fde8e8",
  Done: "#e5f7f0",
};

const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: "#f0f4ff",
  Medium: "#fff8e0",
  High: "#fde8e8",
};

const initialTask: Omit<Task, "id"> = {
  title: "",
  status: "Open",
  priority: "Medium",
  dueDate: "",
  owner: "",
  notes: "",
};

export default function TasksSection({
  tasks,
  onAddTask,
  onPatchTask,
  onDeleteTask,
  collapseSignal,
}: Props) {
  const [form, setForm] = useState(initialTask);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedTasks = useMemo(() => {
    if (!sortKey) return tasks;
    return [...tasks].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tasks, sortKey, sortDir]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAddTask(form);
    setForm(initialTask);
  }

  const columns: ColumnDef<Task>[] = [
    {
      key: "title",
      label: "Task",
      sortable: true,
      width: "200px",
      render: (t) => (
        <input
          className="cell-input"
          value={t.title}
          onChange={(e) => onPatchTask(t.id, { title: e.target.value })}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "130px",
      render: (t) => (
        <select
          className="cell-select"
          value={t.status}
          style={{ background: STATUS_BG[t.status], borderRadius: "999px", paddingLeft: "0.6rem" }}
          onChange={(e) => onPatchTask(t.id, { status: e.target.value as TaskStatus })}
        >
          {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      width: "110px",
      render: (t) => (
        <select
          className="cell-select"
          value={t.priority}
          style={{ background: PRIORITY_BG[t.priority], borderRadius: "999px", paddingLeft: "0.6rem" }}
          onChange={(e) => onPatchTask(t.id, { priority: e.target.value as TaskPriority })}
        >
          {TASK_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      width: "140px",
      render: (t) => (
        <input
          type="date"
          className="cell-input"
          value={t.dueDate}
          onChange={(e) => onPatchTask(t.id, { dueDate: e.target.value })}
        />
      ),
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      width: "130px",
      render: (t) => (
        <input
          className="cell-input"
          placeholder="Owner"
          value={t.owner}
          onChange={(e) => onPatchTask(t.id, { owner: e.target.value })}
        />
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (t) => (
        <input
          className="cell-input"
          placeholder="Notes"
          value={t.notes}
          onChange={(e) => onPatchTask(t.id, { notes: e.target.value })}
        />
      ),
    },
    {
      key: "_actions",
      label: "",
      width: "90px",
      render: (t) => (
        <button className="btn danger" type="button" onClick={() => onDeleteTask(t.id)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <CollapsibleSection title="To-Do Manager" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <select
          value={form.status}
          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
        >
          {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
        >
          {TASK_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        <input
          placeholder="Owner"
          value={form.owner}
          onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
        />
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
        <button className="btn" type="submit">Add Task</button>
      </form>

      <DataTable
        columns={columns}
        rows={sortedTasks}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        getRowKey={(t) => t.id}
        emptyText="No tasks yet. Add one above."
      />
    </CollapsibleSection>
  );
}
