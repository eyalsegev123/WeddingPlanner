import React, { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

const initialTask = {
  title: "",
  status: "Open",
  priority: "Medium",
  dueDate: "",
  owner: "",
  notes: ""
};

export default function TasksSection({ tasks, onAddTask, onDeleteTask, onPatchTask, collapseSignal }) {
  const [form, setForm] = useState(initialTask);

  function submit(event) {
    event.preventDefault();
    onAddTask(form);
    setForm(initialTask);
  }

  return (
    <CollapsibleSection title="To-Do Manager" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input placeholder="Task title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
          <option>Open</option>
          <option>In Progress</option>
          <option>Blocked</option>
          <option>Done</option>
        </select>
        <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
        <input placeholder="Owner" value={form.owner} onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))} />
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        <button className="btn" type="submit">
          Add Task
        </button>
      </form>

      <div className="stack">
        {tasks.map((task) => (
          <article className="row" key={task.id}>
            <div>
              <input value={task.title} onChange={(event) => onPatchTask(task.id, { title: event.target.value })} />
              <div className="form-grid">
                <input type="date" value={task.dueDate} onChange={(event) => onPatchTask(task.id, { dueDate: event.target.value })} />
                <input placeholder="Owner" value={task.owner} onChange={(event) => onPatchTask(task.id, { owner: event.target.value })} />
                <input placeholder="Notes" value={task.notes} onChange={(event) => onPatchTask(task.id, { notes: event.target.value })} />
              </div>
            </div>
            <div className="row-actions">
              <select value={task.status} onChange={(event) => onPatchTask(task.id, { status: event.target.value })}>
                <option>Open</option>
                <option>In Progress</option>
                <option>Blocked</option>
                <option>Done</option>
              </select>
              <select value={task.priority} onChange={(event) => onPatchTask(task.id, { priority: event.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <button className="btn danger" onClick={() => onDeleteTask(task.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
