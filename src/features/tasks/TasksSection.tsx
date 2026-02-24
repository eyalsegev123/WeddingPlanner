import React, { useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import { TASK_PRIORITIES, TASK_STATUSES } from "../../constants/enums";
import type { CollapseSignal, Task, TaskPriority, TaskStatus } from "../../types/wedding";

interface Props {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id">) => void;
  onPatchTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAddTask(form);
    setForm(initialTask);
  }

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
          {TASK_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
          }
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
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
        <button className="btn" type="submit">
          Add Task
        </button>
      </form>

      <div className="stack">
        {tasks.map((task) => (
          <article className="row" key={task.id}>
            <div>
              <input
                value={task.title}
                onChange={(e) => onPatchTask(task.id, { title: e.target.value })}
              />
              <div className="form-grid">
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => onPatchTask(task.id, { dueDate: e.target.value })}
                />
                <input
                  placeholder="Owner"
                  value={task.owner}
                  onChange={(e) => onPatchTask(task.id, { owner: e.target.value })}
                />
                <input
                  placeholder="Notes"
                  value={task.notes}
                  onChange={(e) => onPatchTask(task.id, { notes: e.target.value })}
                />
              </div>
            </div>
            <div className="row-actions">
              <select
                value={task.status}
                onChange={(e) => onPatchTask(task.id, { status: e.target.value as TaskStatus })}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={task.priority}
                onChange={(e) =>
                  onPatchTask(task.id, { priority: e.target.value as TaskPriority })
                }
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <button
                className="btn danger"
                type="button"
                onClick={() => onDeleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
