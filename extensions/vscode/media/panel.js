const vscode = acquireVsCodeApi();
const app = document.getElementById("app");

const emptyDraft = () => ({
  title: "",
  assigneeId: "",
  projectId: "",
  difficulty: "",
  dueDate: "",
  description: "",
});

const state = {
  signedIn: false,
  loading: true,
  busy: false,
  creating: false,
  editingId: null,
  cancelEdit: false,
  menuId: null,
  projectMenuId: null,
  /** "" = all tasks, else project id. */
  projectFilter: "",
  doneHidden: vscode.getState()?.doneHidden !== false,
  draft: emptyDraft(),
  board: null,
};

const iconStart =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>';
const iconDone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Keep in sync with extensions/vscode/src/project-filter.ts ("" | id). */
function matchesProject(task) {
  const filter = state.projectFilter;
  if (!filter) return true;
  return task.projectId === filter;
}

function section(status) {
  return (state.board?.tasks ?? [])
    .filter((task) => task.status === status && matchesProject(task))
    .sort((a, b) => a.order - b.order);
}

function defaultCreateProjectId() {
  return state.projectFilter || "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dueLabel(iso) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function projectPicker(task) {
  const open = state.projectMenuId === task.id;
  const projects = state.board?.projects ?? [];
  const rows = [{ value: "", label: "None" }];
  if (
    task.projectId &&
    task.acronym &&
    !projects.some((project) => project.id === task.projectId)
  ) {
    rows.push({ value: task.projectId, label: task.acronym });
  }
  for (const project of projects) {
    rows.push({
      value: project.id,
      label: project.acronym,
      hint: project.name,
    });
  }
  const trigger = task.acronym
    ? `<button type="button" class="acronym-btn${open ? " open" : ""}" data-project-menu="${task.id}" aria-label="Project" aria-haspopup="menu" aria-expanded="${open}" ${state.busy ? "disabled" : ""}>${escapeHtml(task.acronym)}</button><span class="acronym-sep">·</span>`
    : `<button type="button" class="acronym-btn muted${open ? " open" : ""}" data-project-menu="${task.id}" aria-label="Project" aria-haspopup="menu" aria-expanded="${open}" ${state.busy ? "disabled" : ""}>+</button>`;
  const strip = open
    ? `<div class="project-strip" role="menu">${rows
        .map((row) => {
          const active = (task.projectId || "") === row.value;
          return `<button type="button" role="menuitem" class="project-chip${active ? " active" : ""}" data-set-project="${task.id}" data-project-value="${escapeHtml(row.value)}" title="${escapeHtml(row.hint || row.label)}" ${state.busy ? "disabled" : ""}>${escapeHtml(row.label)}</button>`;
        })
        .join("")}</div>`
    : "";
  return `<span class="project-root">${trigger}${strip}</span>`;
}

function card(task, primary, menu) {
  const title =
    state.editingId === task.id
      ? `<input class="title-input" data-title="${task.id}" value="${escapeHtml(task.title)}" ${state.busy ? "disabled" : ""} />`
      : `<button type="button" class="title" data-edit="${task.id}" ${state.busy ? "disabled" : ""}>${escapeHtml(task.title)}</button>`;
  const due = task.due
    ? `<p class="due${task.status !== "done" && task.due < today() ? " overdue" : ""}">${escapeHtml(dueLabel(task.due))}</p>`
    : "";
  const description = task.description
    ? `<p class="desc">${escapeHtml(task.description)}</p>`
    : "";
  return `<article class="card">
    <span class="handle ${escapeHtml(task.difficulty)}"></span>
    <div class="body">
      <div class="title-row">${projectPicker(task)}${title}</div>
      ${description}
      ${due}
    </div>
    <div class="rail">${primary}${menu}</div>
  </article>`;
}

function options(rows, selected) {
  return rows
    .map(
      (row) =>
        `<option value="${escapeHtml(row.value)}"${row.value === selected ? " selected" : ""}>${escapeHtml(row.label)}</option>`,
    )
    .join("");
}

function iconButton(attr, label, svg) {
  return `<button type="button" class="icon${attr.startsWith("data-start") ? " start" : ""}" ${attr} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" ${state.busy ? "disabled" : ""}>${svg}</button>`;
}

function taskMenu(id) {
  const open = state.menuId === id;
  return `<div class="menu">
    <button type="button" class="menu-toggle${open ? " open" : ""}" data-menu="${id}" aria-label="Task actions" aria-haspopup="menu" aria-expanded="${open}" ${state.busy ? "disabled" : ""}>⋯</button>
    ${
      open
        ? `<div class="menu-panel" role="menu">
      <button type="button" role="menuitem" data-open="${id}">Open</button>
      <button type="button" role="menuitem" data-clone="${id}" ${state.busy ? "disabled" : ""}>Clone</button>
      <button type="button" role="menuitem" class="danger" data-delete="${id}" ${state.busy ? "disabled" : ""}>Delete</button>
    </div>`
        : ""
    }
  </div>`;
}

function createBlock() {
  const board = state.board;
  if (!board) return "";
  if (!state.creating) return "";
  const draft = state.draft;
  const memberRows = board.members.map((member) => ({
    value: member.id,
    label: member.label,
  }));
  const assignee =
    memberRows.length > 1
      ? `<label>Assignee<select name="assigneeId" ${state.busy ? "disabled" : ""}>${options(memberRows, draft.assigneeId || board.userId)}</select></label>`
      : `<input type="hidden" name="assigneeId" value="${escapeHtml(draft.assigneeId || board.userId)}" />`;
  return `<form class="create" id="create">
    <label>Title
      <input name="title" maxlength="200" required placeholder="What needs to be done?" value="${escapeHtml(draft.title)}" ${state.busy ? "disabled" : ""} />
    </label>
    ${assignee}
    <label>Project
      <select name="projectId" ${state.busy ? "disabled" : ""}>${options(
        [
          { value: "", label: "None" },
          ...board.projects.map((project) => ({
            value: project.id,
            label: `${project.acronym} · ${project.name}`,
          })),
        ],
        draft.projectId,
      )}</select>
    </label>
    <label>Difficulty
      <select name="difficulty" ${state.busy ? "disabled" : ""}>${options(
        [
          { value: "", label: "None" },
          { value: "easy", label: "Easy" },
          { value: "medium", label: "Medium" },
          { value: "hard", label: "Hard" },
        ],
        draft.difficulty,
      )}</select>
    </label>
    <label>Due<input name="dueDate" type="date" value="${escapeHtml(draft.dueDate)}" ${state.busy ? "disabled" : ""} /></label>
    <label>Description
      <textarea name="description" maxlength="4000" placeholder="Optional details" ${state.busy ? "disabled" : ""}>${escapeHtml(draft.description)}</textarea>
    </label>
    <div class="actions">
      <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>Save</button>
      <button type="button" class="link" id="cancel-create" ${state.busy ? "disabled" : ""}>Cancel</button>
    </div>
  </form>`;
}

function addButton() {
  if (!state.board || state.creating) return "";
  return `<button type="button" class="link add" id="open-create" ${state.busy ? "disabled" : ""}>+ Add task</button>`;
}

function projectPick() {
  const board = state.board;
  if (!board?.groupId) return "";
  const filter =
    state.projectFilter && board.projects.some((project) => project.id === state.projectFilter)
      ? state.projectFilter
      : "";
  const rows = [
    { value: "", label: "Project" },
    ...board.projects.map((project) => ({
      value: project.id,
      label: `${project.acronym} · ${project.name}`,
    })),
  ];
  return `<select id="project" class="project-select" aria-label="Project" ${state.busy ? "disabled" : ""}>${options(rows, filter)}</select>`;
}

function toolbar() {
  return `<div class="toolbar">${projectPick()}${addButton()}</div>`;
}

function header() {
  const board = state.board;
  if (!board) return "";
  if (board.groups.length > 1) {
    return `<label class="group-pick">Group
      <select id="group" ${state.busy ? "disabled" : ""}>${options(
        board.groups.map((group) => ({ value: group.id, label: group.name })),
        board.groupId ?? "",
      )}</select>
    </label>`;
  }
  return `<p class="group">${escapeHtml(board.groupName || "No group")}</p>`;
}

function statusLine() {
  return state.busy ? `<p class="status">Saving…</p>` : "";
}

function column(title, tasks, html, opts = {}) {
  const body = tasks.length ? html : `<p class="empty">Nothing here.</p>`;
  const list = opts.scroll ? `<div class="scroll">${body}</div>` : body;
  const hidden = opts.hide && state.doneHidden;
  const head = opts.hide
    ? `<div class="section-head"><h2>${title} (${tasks.length})</h2><button type="button" class="link" id="toggle-done">${hidden ? "Show" : "Hide"}</button></div>`
    : `<h2>${title} (${tasks.length})</h2>`;
  const kind = opts.kind ? ` ${opts.kind}` : "";
  return `<section class="section${kind}">${head}${hidden ? "" : list}</section>`;
}

function boardView() {
  if (!state.board) {
    return `${statusLine()}<p class="hint">No column yet.</p>`;
  }
  if (!state.board.groupId) {
    return `${header()}${statusLine()}<p class="hint">You are not in a group yet.</p>`;
  }
  const todo = section("todo");
  const doing = section("doing");
  const done = section("done");
  const none = todo.length + doing.length + done.length === 0;
  const roomy = state.creating || !state.doneHidden;
  if (none) {
    const empty =
      (state.board.tasks ?? []).length === 0
        ? "No tasks assigned to you yet."
        : "No tasks in this project.";
    return `<div class="board${roomy ? " roomy" : ""}">
      <div class="board-top">${header()}${statusLine()}${toolbar()}${createBlock()}
        <p class="empty">${empty}</p>
      </div>
    </div>`;
  }
  return `<div class="board${roomy ? " roomy" : ""}">
    <div class="board-top">${header()}${statusLine()}${toolbar()}${createBlock()}</div>
    <div class="board-cols">
      ${column(
        "To do",
        todo,
        todo
          .map((task) =>
            card(
              task,
              iconButton(`data-start="${task.id}"`, "Start", iconStart),
              taskMenu(task.id),
            ),
          )
          .join(""),
        { scroll: true, kind: "todo" },
      )}
      ${column(
        "In progress",
        doing,
        doing
          .map((task) =>
            card(
              task,
              iconButton(`data-done="${task.id}"`, "Complete", iconDone),
              taskMenu(task.id),
            ),
          )
          .join(""),
        { scroll: true, kind: "doing" },
      )}
    </div>
    ${column(
      "Done",
      done,
      done
        .map((task) =>
          card(
            task,
            `<span class="icon" title="Completed">${iconDone}</span>`,
            taskMenu(task.id),
          ),
        )
        .join(""),
      { hide: true, kind: "done" },
    )}
  </div>`;
}

function rememberDraft() {
  const form = document.getElementById("create");
  if (!form) return;
  state.draft = {
    title: form.elements.title?.value ?? "",
    assigneeId: form.elements.assigneeId?.value ?? "",
    projectId: form.elements.projectId?.value ?? "",
    difficulty: form.elements.difficulty?.value ?? "",
    dueDate: form.elements.dueDate?.value ?? "",
    description: form.elements.description?.value ?? "",
  };
}

function render() {
  const scroll = window.scrollY;
  const lists = [...app.querySelectorAll(".scroll")].map((el) => el.scrollTop);
  if (state.loading && !state.board) {
    app.innerHTML = `<p class="status">Loading…</p>`;
    return;
  }
  app.innerHTML = state.signedIn
    ? boardView()
    : `<div class="login">
        <h1 class="login-title">SRelay extension to bring your work into the editor</h1>
        <p>This shows only your work — other people's tasks stay on the web. Open the site to learn more about the project.</p>
        ${statusLine()}
        <button type="button" class="link" id="open-site">Open on SRelay</button>
        <button type="button" class="primary" id="sign-in" ${state.busy ? "disabled" : ""}>Sign in</button>
        <details class="code">
          <summary>I have a code</summary>
          <form id="paste">
            <label>Code
              <span class="code-row">
                <input name="token" placeholder="vscode-…" autocomplete="off" spellcheck="false" />
                <button type="button" class="link" id="paste-clip">Paste</button>
              </span>
            </label>
            <button class="primary" type="submit">Use code</button>
          </form>
        </details>
      </div>`;
  window.scrollTo(0, scroll);
  app.querySelectorAll(".scroll").forEach((el, index) => {
    el.scrollTop = lists[index] ?? 0;
  });
  bind();
}

function bind() {
  document.getElementById("open-site")?.addEventListener("click", () => {
    vscode.postMessage({ type: "open-site" });
  });
  document.getElementById("sign-in")?.addEventListener("click", () => {
    if (state.busy) return;
    vscode.postMessage({ type: "sign-in" });
  });
  document.getElementById("paste-clip")?.addEventListener("click", () => {
    vscode.postMessage({ type: "clip" });
  });
  document.getElementById("paste")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.busy) return;
    const token = event.currentTarget.elements.token.value.trim();
    if (!token) return;
    state.busy = true;
    render();
    vscode.postMessage({ type: "paste", token });
  });
  document.getElementById("toggle-done")?.addEventListener("click", () => {
    state.doneHidden = !state.doneHidden;
    vscode.setState({ doneHidden: state.doneHidden });
    render();
  });
  document.getElementById("group")?.addEventListener("change", (event) => {
    if (state.busy) return;
    state.busy = true;
    state.creating = false;
    state.menuId = null;
    state.projectMenuId = null;
    state.draft = emptyDraft();
    render();
    vscode.postMessage({ type: "select-group", groupId: event.target.value });
  });
  document.getElementById("project")?.addEventListener("change", (event) => {
    if (state.busy) return;
    state.projectFilter = event.target.value;
    state.menuId = null;
    state.projectMenuId = null;
    render();
    vscode.postMessage({ type: "select-project", projectFilter: event.target.value });
  });
  document.getElementById("open-create")?.addEventListener("click", () => {
    state.creating = true;
    state.menuId = null;
    state.projectMenuId = null;
    state.draft = { ...emptyDraft(), projectId: defaultCreateProjectId() };
    render();
    app.querySelector("#create [name=title]")?.focus();
  });
  document.getElementById("cancel-create")?.addEventListener("click", () => {
    state.creating = false;
    state.draft = emptyDraft();
    render();
  });
  document.getElementById("create")?.addEventListener("input", rememberDraft);
  document.getElementById("create")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.busy) return;
    rememberDraft();
    const title = state.draft.title.trim();
    if (!title) return;
    state.busy = true;
    render();
    vscode.postMessage({
      type: "create",
      fields: { ...state.draft, title },
    });
  });
  for (const button of app.querySelectorAll("[data-edit]")) {
    button.addEventListener("click", () => {
      if (state.busy) return;
      state.editingId = button.getAttribute("data-edit");
      state.cancelEdit = false;
      render();
      const input = app.querySelector(".title-input");
      input?.focus();
      input?.select();
    });
  }
  const input = app.querySelector(".title-input");
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
    if (event.key === "Escape") {
      state.cancelEdit = true;
      state.editingId = null;
      render();
    }
  });
  input?.addEventListener("blur", () => {
    if (state.cancelEdit) {
      state.cancelEdit = false;
      return;
    }
    const title = input.value.trim();
    const id = input.getAttribute("data-title");
    const current = state.board?.tasks?.find((task) => task.id === id);
    state.editingId = null;
    if (!title || title === current?.title) {
      render();
      return;
    }
    state.busy = true;
    render();
    vscode.postMessage({ type: "title", id, title });
  });
  for (const button of app.querySelectorAll("[data-menu]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.busy) return;
      const id = button.getAttribute("data-menu");
      state.projectMenuId = null;
      state.menuId = state.menuId === id ? null : id;
      render();
    });
  }
  for (const button of app.querySelectorAll("[data-project-menu]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.busy) return;
      const id = button.getAttribute("data-project-menu");
      state.menuId = null;
      state.projectMenuId = state.projectMenuId === id ? null : id;
      render();
    });
  }
  for (const button of app.querySelectorAll("[data-set-project]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.busy) return;
      const id = button.getAttribute("data-set-project");
      const projectId = button.getAttribute("data-project-value") ?? "";
      const current = state.board?.tasks?.find((task) => task.id === id);
      state.projectMenuId = null;
      if ((current?.projectId || "") === projectId) {
        render();
        return;
      }
      state.busy = true;
      render();
      vscode.postMessage({ type: "project", id, projectId });
    });
  }
  for (const button of app.querySelectorAll("[data-open]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.menuId = null;
      state.projectMenuId = null;
      render();
      vscode.postMessage({ type: "open-task", id: button.getAttribute("data-open") });
    });
  }
  for (const button of app.querySelectorAll("[data-clone]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.busy) return;
      state.menuId = null;
      state.projectMenuId = null;
      state.busy = true;
      render();
      vscode.postMessage({ type: "clone", id: button.getAttribute("data-clone") });
    });
  }
  for (const button of app.querySelectorAll("[data-delete]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.busy) return;
      state.menuId = null;
      state.projectMenuId = null;
      state.busy = true;
      render();
      vscode.postMessage({ type: "delete", id: button.getAttribute("data-delete") });
    });
  }
  for (const button of app.querySelectorAll("[data-start]")) {
    button.addEventListener("click", () => sendMove(button, "data-start", "doing"));
  }
  for (const button of app.querySelectorAll("[data-done]")) {
    button.addEventListener("click", () => sendMove(button, "data-done", "done"));
  }
  if (state.menuId || state.projectMenuId) {
    const close = () => {
      state.menuId = null;
      state.projectMenuId = null;
      render();
    };
    setTimeout(() => {
      document.addEventListener("click", close, { once: true });
    }, 0);
  }
}

function sendMove(button, attr, status) {
  if (state.busy) return;
  state.busy = true;
  render();
  vscode.postMessage({ type: "move", id: button.getAttribute(attr), status });
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message?.type === "clipboard") {
    const input = document.querySelector('#paste input[name="token"]');
    if (input) input.value = message.text || "";
    return;
  }
  if (!message || message.type !== "state") return;
  state.loading = false;
  state.busy = false;
  state.menuId = null;
  state.projectMenuId = null;
  state.signedIn = message.signedIn;
  state.projectFilter = message.projectFilter || "";
  if (message.board) state.board = message.board;
  else if (!message.signedIn) state.board = null;
  if (message.created) {
    state.creating = false;
    state.draft = emptyDraft();
  }
  render();
});

vscode.postMessage({ type: "ready" });
render();
