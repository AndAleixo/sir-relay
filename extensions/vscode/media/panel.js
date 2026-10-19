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
  error: "",
  notice: "",
  creating: false,
  editingId: null,
  cancelEdit: false,
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

function section(status) {
  return (state.board?.tasks ?? [])
    .filter((task) => task.status === status)
    .sort((a, b) => a.order - b.order);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dueLabel(iso) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function card(task, actions) {
  const title =
    state.editingId === task.id
      ? `<input class="title-input" data-title="${task.id}" value="${escapeHtml(task.title)}" ${state.busy ? "disabled" : ""} />`
      : `<button type="button" class="title" data-edit="${task.id}" ${state.busy ? "disabled" : ""}>${task.acronym ? `<span class="acronym">${escapeHtml(task.acronym)}</span> · ` : ""}${escapeHtml(task.title)}</button>`;
  const due = task.due
    ? `<p class="due${task.status !== "done" && task.due < today() ? " overdue" : ""}">${escapeHtml(dueLabel(task.due))}</p>`
    : "";
  const description = task.description
    ? `<p class="desc">${escapeHtml(task.description)}</p>`
    : "";
  return `<article class="card">
    <span class="handle ${escapeHtml(task.difficulty)}"></span>
    <div class="body">
      <div class="title-row">${title}${actions}</div>
      ${description}
      ${due}
    </div>
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

function createBlock() {
  const board = state.board;
  if (!board) return "";
  if (!state.creating) {
    return `<button type="button" class="link add" id="open-create" ${state.busy ? "disabled" : ""}>+ Add task</button>`;
  }
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

function banners() {
  return [
    state.error
      ? `<p class="banner error">${escapeHtml(state.error)} <button type="button" class="link" id="retry">Try again</button></p>`
      : "",
    state.notice ? `<p class="banner notice">${escapeHtml(state.notice)}</p>` : "",
    state.busy ? `<p class="status">Saving…</p>` : "",
  ].join("");
}

function column(title, tasks, html, extra = "", opts = {}) {
  const body = tasks.length ? html : `<p class="empty">Nothing here.</p>`;
  const list = opts.scroll
    ? `<div class="scroll${opts.tall ? " tall" : ""}">${body}</div>`
    : body;
  const hidden = opts.hide && state.doneHidden;
  const head = opts.hide
    ? `<div class="section-head"><h2>${title} (${tasks.length})</h2><button type="button" class="link" id="toggle-done">${hidden ? "Show" : "Hide"}</button></div>`
    : `<h2>${title} (${tasks.length})</h2>`;
  return `<section class="section">${head}${hidden ? "" : list}${hidden ? "" : extra}</section>`;
}

function boardView() {
  if (!state.board) {
    return `${banners()}<p class="hint">No column yet.</p><p class="foot"><button type="button" class="link" id="sign-out">Sign out</button></p>`;
  }
  if (!state.board.groupId) {
    return `${header()}${banners()}<p class="hint">You are not in a group yet.</p><p class="foot"><button type="button" class="link" id="sign-out">Sign out</button></p>`;
  }
  const todo = section("todo");
  const doing = section("doing");
  const done = section("done");
  const none = todo.length + doing.length + done.length === 0;
  return `${header()}${banners()}${createBlock()}
    ${
      none
        ? `<p class="empty">No tasks assigned to you yet.</p>`
        : `${column(
            "To do",
            todo,
            todo
              .map((task) =>
                card(task, iconButton(`data-start="${task.id}"`, "Start", iconStart)),
              )
              .join(""),
            "",
            { scroll: true, tall: true },
          )}
      ${column(
        "In progress",
        doing,
        doing
          .map((task) => card(task, iconButton(`data-done="${task.id}"`, "Complete", iconDone)))
          .join(""),
        "",
        { scroll: true },
      )}
      ${column(
        "Done",
        done,
        done.map((task) => card(task, `<span class="icon" title="Completed">${iconDone}</span>`)).join(""),
        "",
        { hide: true },
      )}`
    }
    <p class="foot"><button type="button" class="link" id="sign-out" ${state.busy ? "disabled" : ""}>Sign out</button></p>`;
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
        ${banners()}
        <button type="button" class="link" id="open-site">See SRelay</button>
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
  document.getElementById("retry")?.addEventListener("click", () => {
    state.busy = true;
    state.error = "";
    render();
    vscode.postMessage({ type: "ready" });
  });
  document.getElementById("toggle-done")?.addEventListener("click", () => {
    state.doneHidden = !state.doneHidden;
    vscode.setState({ doneHidden: state.doneHidden });
    render();
  });
  document.getElementById("sign-out")?.addEventListener("click", () => {
    if (state.busy) return;
    state.creating = false;
    state.editingId = null;
    state.draft = emptyDraft();
    vscode.postMessage({ type: "sign-out" });
  });
  document.getElementById("group")?.addEventListener("change", (event) => {
    if (state.busy) return;
    state.busy = true;
    state.creating = false;
    state.draft = emptyDraft();
    render();
    vscode.postMessage({ type: "select-group", groupId: event.target.value });
  });
  document.getElementById("open-create")?.addEventListener("click", () => {
    state.creating = true;
    state.notice = "";
    state.draft = emptyDraft();
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
  for (const button of app.querySelectorAll("[data-start]")) {
    button.addEventListener("click", () => sendMove(button, "data-start", "doing"));
  }
  for (const button of app.querySelectorAll("[data-done]")) {
    button.addEventListener("click", () => sendMove(button, "data-done", "done"));
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
  state.signedIn = message.signedIn;
  state.error = message.error || "";
  state.notice = message.notice || "";
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
