import { dirname, resolve } from 'path';
import { TodoUtils, idNum } from './TodoUtils.js';
import { TodoParser } from './TodoParser.js';

export class TodoManager {
  constructor(filePath = '.todo.json') {
    this.filePath = filePath;
  }

  async _load() {
    if (!await TodoUtils.fileExists(this.filePath)) return {};
    const content = await TodoUtils.readFile(this.filePath);
    const todos = TodoParser.parseContent(content);
    this._normalizeKinds(todos);
    return todos;
  }

  // A legacy (or just-created) `type: "subtask"` marker is not a semantic kind —
  // subtask-ness is derived from `parent` presence. Strip the redundant marker
  // in memory on every read; like the v3 order/archived migration, this is only
  // ever persisted the next time that list is written (reads never rewrite the
  // file). Items created *after* this call in the same operation are untouched,
  // so a freshly-created default subtask still round-trips with `type: "subtask"`
  // on disk until some later write touches that list again.
  _normalizeKinds(todos) {
    for (const list of Object.values(todos)) {
      if (!list || !list.tasks) continue;
      for (const task of Object.values(list.tasks)) {
        if (task && task.type === 'subtask' && task.parent) delete task.type;
      }
    }
  }

  async _save(todos) {
    for (const key of Object.keys(todos)) this._canonicalize(todos[key]);
    await TodoUtils.writeFile(this.filePath, TodoParser.generateContent(todos));
  }

  async _withLock(fn) {
    const lock = await TodoUtils.acquireLock(this.filePath);
    try { return await fn(); }
    finally { await TodoUtils.releaseLock(lock); }
  }

  // --- ID generation ---

  _nextId(list) {
    const counter = ++list.counter;
    return `${list.prefix}-${String(counter).padStart(3, '0')}`;
  }

  // --- Item creation ---

  _createItem(text, { assignee, description, type } = {}) {
    const entry = { text, completed: false, status: 'open' };
    if (assignee) entry.assignee = assignee;
    if (description) entry.description = description;
    if (type) entry.type = String(type).toLowerCase();
    return entry;
  }

  // Status is a first-class open/doing/done field; `completed` is kept in sync (done<=>completed)
  // for backward compatibility. Older items with no `status` derive it from `completed`.
  static deriveStatus(item) {
    if (item.status) return item.status;
    return item.completed ? 'done' : 'open';
  }

  // --- Shape normalization (v3) ---

  /**
   * Derive the canonical top-level order and archived id lists for a list,
   * without mutating it. Supports legacy files where ordering lived in a
   * per-task numeric `order` field and archiving in a per-task `archived` flag.
   */
  _computeOrder(list) {
    const tasks = (list && list.tasks) || {};
    const isSub = id => tasks[id] && !!tasks[id].parent;

    const archivedIds = [];
    const pushArch = id => { if (tasks[id] && !archivedIds.includes(id)) archivedIds.push(id); };
    if (Array.isArray(list.archived)) for (const id of list.archived) pushArch(id);
    for (const [id, t] of Object.entries(tasks)) if (t && t.archived === true) pushArch(id);
    const archivedSet = new Set(archivedIds);

    const topIds = Object.keys(tasks).filter(id => !isSub(id) && !archivedSet.has(id));

    const orderIds = [];
    if (Array.isArray(list.order)) {
      for (const id of list.order) {
        if (topIds.includes(id) && !orderIds.includes(id)) orderIds.push(id);
      }
    }
    const missing = topIds.filter(id => !orderIds.includes(id));
    const ord = t => (typeof t.order === 'number' ? t.order : Number.MAX_SAFE_INTEGER);
    missing.sort((a, b) => (ord(tasks[a]) - ord(tasks[b])) || (idNum(a) - idNum(b)));
    orderIds.push(...missing);

    return { orderIds, archivedIds };
  }

  /**
   * Rewrite a list into the canonical v3 shape: order/archived arrays at the
   * list level, and no per-task numeric `order` or boolean `archived` fields.
   * Called for every list on every write (via _save).
   */
  _canonicalize(list) {
    if (!list || typeof list !== 'object' || !list.tasks) return list;
    const { orderIds, archivedIds } = this._computeOrder(list);
    list.order = orderIds;
    list.archived = archivedIds;
    for (const t of Object.values(list.tasks)) {
      delete t.order;
      delete t.archived;
    }
    return list;
  }

  // --- Validation ---

  _requireList(todos, name) {
    if (!(name in todos)) throw new Error(`Todo '${name}' not found.`);
    return todos[name];
  }

  _requireItem(todos, name, id) {
    const list = this._requireList(todos, name);
    if (!list.tasks || !(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
    return list.tasks[id];
  }

  // --- Prefix resolution ---

  _parsePrefix(id) {
    const dash = id.indexOf('-');
    return dash > 0 ? id.substring(0, dash) : null;
  }

  _resolveRef(list, prefix) {
    if (!list.references || !list.references[prefix]) return null;
    const ref = list.references[prefix];
    const hashIdx = ref.indexOf('#');
    if (hashIdx === -1) return { file: ref, listName: null };
    return { file: ref.substring(0, hashIdx), listName: ref.substring(hashIdx + 1) };
  }

  _resolveFilePath(ref) {
    const base = dirname(resolve(this.filePath));
    return resolve(base, ref);
  }

  // --- Query helpers ---

  _topActive(list) {
    const { orderIds } = this._computeOrder(list);
    return orderIds.map(id => ({ id, ...list.tasks[id] }));
  }

  _subtaskItems(tasks, parentId) {
    const ord = t => (typeof t.order === 'number' ? t.order : Number.MAX_SAFE_INTEGER);
    return Object.entries(tasks)
      .filter(([, item]) => item.parent === parentId)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => (ord(a) - ord(b)) || (idNum(a.id) - idNum(b.id)));
  }

  _enrich(list, items) {
    const tasks = list.tasks || {};
    return items.map(item => {
      const status = TodoManager.deriveStatus(item);
      const subs = this._subtaskItems(tasks, item.id);
      return {
        ...item,
        status,
        kind: TodoUtils.kindOf(item),
        subtaskTotal: subs.length,
        subtaskCompleted: subs.filter(s => s.completed).length,
        hasDescription: !!(item.description && String(item.description).length),
        commentCount: item.comments ? item.comments.length : 0
      };
    });
  }

  // --- Goal linking helpers (PKG-143) ---

  _findTask(todos, id) {
    for (const [listName, list] of Object.entries(todos)) {
      if (list && list.tasks && id in list.tasks) return { listName, list, task: list.tasks[id] };
    }
    return null;
  }

  _requireGoal(todos, goalId) {
    const found = this._findTask(todos, goalId);
    if (!found) throw new Error(`Goal '${goalId}' not found.`);
    if (TodoUtils.kindOf(found.task) !== 'goal') throw new Error(`'${goalId}' is not a goal.`);
    return found;
  }

  // Every top-level task (any list) whose `goal` field points at `goalId`,
  // enriched with its own subtask totals (rolled up into the goal's progress).
  _linkedTasks(todos, goalId) {
    const out = [];
    for (const list of Object.values(todos)) {
      if (!list || !list.tasks) continue;
      for (const [id, task] of Object.entries(list.tasks)) {
        if (task.goal !== goalId) continue;
        const subs = this._subtaskItems(list.tasks, id);
        out.push({
          id,
          ...task,
          subtaskTotal: subs.length,
          subtaskCompleted: subs.filter(s => s.completed).length
        });
      }
    }
    return out;
  }

  // --- Read operations ---

  async list() {
    const todos = await this._load();
    return Object.entries(todos).map(([name, list]) => {
      const { orderIds, archivedIds } = this._computeOrder(list);
      const top = orderIds.map(id => list.tasks[id]);
      return {
        name,
        prefix: list.prefix,
        total: top.length,
        completed: top.filter(t => TodoManager.deriveStatus(t) === 'done').length,
        archived: archivedIds.length
      };
    });
  }

  async view(name, { type, goal } = {}) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    let items = this._enrich(list, this._topActive(list));
    if (type) items = items.filter(it => it.kind === type);
    if (goal) items = items.filter(it => it.goal === goal);
    return { title: name, prefix: list.prefix, items };
  }

  async viewSubtasks(name, parentId) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, parentId);
    const list = todos[name];
    const subs = this._enrich(list, this._subtaskItems(list.tasks, parentId));
    return { title: `${name} > ${parentId}: ${item.text}`, items: subs };
  }

  async get(name, id) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, id);
    const list = todos[name];
    const subs = this._subtaskItems(list.tasks, id);
    return {
      id,
      name,
      text: item.text || '',
      description: item.description || '',
      status: TodoManager.deriveStatus(item),
      completed: !!item.completed,
      assignee: item.assignee || '',
      parent: item.parent || '',
      kind: TodoUtils.kindOf(item),
      goal: item.goal || '',
      comments: item.comments || [],
      subtaskTotal: subs.length,
      subtaskCompleted: subs.filter(s => s.completed).length
    };
  }

  // One line per goal (any list), with linked-task progress rolled up (incl. subtasks).
  // Archived goals are hidden from this rollup; their linked tasks still count
  // toward any OTHER (non-archived) goal's own progress.
  async goals() {
    const todos = await this._load();
    const result = [];
    for (const [listName, list] of Object.entries(todos)) {
      if (!list || !list.tasks) continue;
      const { archivedIds } = this._computeOrder(list);
      const archivedSet = new Set(archivedIds);
      for (const [id, task] of Object.entries(list.tasks)) {
        if (TodoUtils.kindOf(task) !== 'goal') continue;
        if (archivedSet.has(id)) continue;
        const linked = this._linkedTasks(todos, id);
        const linkedTotal = linked.reduce((sum, t) => sum + 1 + t.subtaskTotal, 0);
        const linkedCompleted = linked.reduce(
          (sum, t) => sum + (TodoManager.deriveStatus(t) === 'done' ? 1 : 0) + t.subtaskCompleted,
          0
        );
        result.push({
          id,
          name: listName,
          text: task.text || '',
          status: TodoManager.deriveStatus(task),
          linkedTotal,
          linkedCompleted,
          allDone: linkedTotal > 0 && linkedCompleted === linkedTotal
        });
      }
    }
    return result;
  }

  async archiveList(name) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const { archivedIds } = this._computeOrder(list);
    const items = this._enrich(list, archivedIds.map(id => ({ id, ...list.tasks[id] })));
    return { title: `${name} [${list.prefix}] (archived)`, prefix: list.prefix, items };
  }

  // --- Write operations ---

  async add(name, prefix, items = [], { assignee, description, type } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      if (name in todos) throw new Error(`Todo '${name}' already exists.`);

      if (!prefix || !/^[A-Z]{2,10}$/.test(prefix)) {
        throw new Error(`Prefix must be 2-10 uppercase letters. Got: '${prefix}'.`);
      }

      // Check prefix uniqueness within file
      for (const [n, l] of Object.entries(todos)) {
        if (l.prefix === prefix) throw new Error(`Prefix '${prefix}' already used by '${n}'.`);
      }

      const list = { prefix, counter: 0, order: [], archived: [], tasks: {} };
      for (const text of items) {
        const id = this._nextId(list);
        list.tasks[id] = this._createItem(text, { assignee, description, type });
      }

      todos[name] = list;
      await this._save(todos);
      return { title: name, prefix };
    });
  }

  async addItem(name, item, { assignee, description, type, goal } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      const id = this._nextId(list);
      const entry = this._createItem(item, { assignee, description, type });
      if (goal) {
        this._requireGoal(todos, goal);
        entry.goal = goal;
      }
      list.tasks[id] = entry;

      await this._save(todos);
      return { id };
    });
  }

  async addSubtask(name, parentId, item, { assignee, description, type } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const parent = this._requireItem(todos, name, parentId);

      if (parent.parent) {
        throw new Error(`Cannot add subtask to a subtask. Parent '${parentId}' is already a subtask.`);
      }

      if (type && String(type).toLowerCase() === 'goal') {
        throw new Error("Cannot create a subtask with type 'goal'. Subtasks cannot be goals.");
      }

      const list = todos[name];

      // Determine which list gets the subtask
      const parentPrefix = this._parsePrefix(parentId);
      let targetManager = this;
      let targetTodos = todos;
      let targetList = list;

      if (parentPrefix && parentPrefix !== list.prefix) {
        const ref = this._resolveRef(list, parentPrefix);
        if (ref) {
          const foreignPath = this._resolveFilePath(ref.file);
          targetManager = new TodoManager(foreignPath);
          targetTodos = await targetManager._load();
          const targetListName = ref.listName || Object.keys(targetTodos).find(n => targetTodos[n].prefix === parentPrefix);
          targetList = targetTodos[targetListName];
        }
      }

      const id = this._nextId(targetList);
      // Default kind for a subtask stays the legacy 'subtask' marker (preserves
      // the on-disk shape); an explicit --type overrides it with a real kind.
      // Either way, subtask-ness itself comes from `parent`, not from `type`.
      const entry = this._createItem(item, { assignee, description, type: type || 'subtask' });
      entry.parent = parentId;
      targetList.tasks[id] = entry;

      if (targetManager === this) {
        await this._save(todos);
      } else {
        await targetManager._save(targetTodos);
      }

      return { id };
    });
  }

  async toggle(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      item.completed = !item.completed;
      item.status = item.completed ? 'done' : 'open';
      await this._save(todos);
      return item.completed;
    });
  }

  async move(name, id, status) {
    const valid = ['open', 'doing', 'done'];
    if (!valid.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: open, doing, done.`);
    }
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      item.status = status;
      item.completed = status === 'done';
      await this._save(todos);
      return { id, status, completed: item.completed };
    });
  }

  async archiveAdd(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (item.parent) {
        throw new Error('Cannot archive a subtask. Archive its parent instead.');
      }
      const list = todos[name];
      this._canonicalize(list);
      if (list.archived.includes(id)) {
        throw new Error(`Item '${id}' is already archived.`);
      }
      list.order = list.order.filter(x => x !== id);
      list.archived.push(id);
      await this._save(todos);
      return { id };
    });
  }

  async archiveRemove(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      this._requireItem(todos, name, id);
      const list = todos[name];
      this._canonicalize(list);
      if (!list.archived.includes(id)) {
        throw new Error(`Item '${id}' is not archived.`);
      }
      list.archived = list.archived.filter(x => x !== id);
      if (!list.order.includes(id)) list.order.push(id);
      await this._save(todos);
      return { id };
    });
  }

  async commentRemove(name, id, index, author) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      const comments = item.comments || [];
      const i = Number(index);
      if (!Number.isInteger(i) || i < 0 || i >= comments.length) {
        return { comments };
      }
      if (author && comments[i].author !== author) {
        throw new Error('You can only delete your own comments.');
      }
      comments.splice(i, 1);
      item.comments = comments;
      await this._save(todos);
      return { comments };
    });
  }

  async assign(name, id, assignee) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (assignee) { item.assignee = assignee; } else { delete item.assignee; }
      await this._save(todos);
    });
  }

  // --- Goal linking (PKG-143) ---

  async link(name, id, goalId) {
    if (!goalId) throw new Error('Goal id is required.');
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (item.parent) throw new Error('Cannot link a subtask to a goal. Link its parent instead.');
      if (id === goalId) throw new Error(`Item '${id}' cannot be linked to itself.`);
      this._requireGoal(todos, goalId);
      item.goal = goalId;
      await this._save(todos);
      return { id, goal: goalId };
    });
  }

  async unlink(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      delete item.goal;
      await this._save(todos);
      return { id };
    });
  }

  async rename(name, id, text) {
    if (!text || !String(text).trim()) throw new Error('Item text cannot be empty.');
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      item.text = text;
      await this._save(todos);
      return { id, text };
    });
  }

  async renameList(oldName, newName) {
    if (!newName || !String(newName).trim()) throw new Error('New list name cannot be empty.');
    return this._withLock(async () => {
      const todos = await this._load();
      this._requireList(todos, oldName);
      if (oldName === newName) return { oldName, newName };
      if (newName in todos) throw new Error(`Todo '${newName}' already exists.`);

      // Rebuild the object so the renamed list keeps its position in insertion order.
      const rebuilt = {};
      for (const key of Object.keys(todos)) {
        if (key === oldName) rebuilt[newName] = todos[oldName];
        else rebuilt[key] = todos[key];
      }

      await this._save(rebuilt);
      return { oldName, newName };
    });
  }

  async describe(name, id, description) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (description) { item.description = description; } else { delete item.description; }
      await this._save(todos);
    });
  }

  async comment(name, id, author, message) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (!item.comments) item.comments = [];
      item.comments.push({ author, message, date: new Date().toISOString() });
      await this._save(todos);
    });
  }

  async addReference(name, prefix, target) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      if (!list.references) list.references = {};
      list.references[prefix] = target;
      await this._save(todos);
    });
  }

  async removeReference(name, prefix) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      if (list.references) {
        delete list.references[prefix];
        if (Object.keys(list.references).length === 0) delete list.references;
      }
      await this._save(todos);
    });
  }

  async remove(name) {
    return this._withLock(async () => {
      const todos = await this._load();
      this._requireList(todos, name);
      delete todos[name];
      await this._save(todos);
    });
  }

  // Every descendant subtask of `id`, found by scanning ALL lists in the file
  // (not just `name`) — subtasks are not guaranteed to live in the same list
  // as their parent. Returns [{ listName, id }], deepest-first order not required.
  _descendantSubtasks(todos, id) {
    const out = [];
    const visit = (parentId) => {
      for (const [listName, list] of Object.entries(todos)) {
        if (!list || !list.tasks) continue;
        for (const [cid, t] of Object.entries(list.tasks)) {
          if (t && t.parent === parentId) {
            out.push({ listName, id: cid });
            visit(cid);
          }
        }
      }
    };
    visit(id);
    return out;
  }

  async removeItem(name, id, { cascade } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);

      const descendants = this._descendantSubtasks(todos, id);
      if (descendants.length > 0 && !cascade) {
        const s = descendants.length !== 1 ? 's' : '';
        throw new Error(
          `Item '${id}' has ${descendants.length} subtask${s}. Use --cascade true to remove it and all its subtasks.`
        );
      }

      // Removing a goal clears the `goal` field on every task (any list) that
      // points at it, so no task is left dangling off a deleted goal.
      let unlinkedCount = 0;
      if (TodoUtils.kindOf(item) === 'goal') {
        for (const list of Object.values(todos)) {
          if (!list || !list.tasks) continue;
          for (const t of Object.values(list.tasks)) {
            if (t.goal === id) { delete t.goal; unlinkedCount++; }
          }
        }
      }

      for (const d of descendants) delete todos[d.listName].tasks[d.id];
      delete todos[name].tasks[id];

      await this._save(todos);
      return { id, subtasksRemoved: descendants.length, unlinkedCount };
    });
  }

  // --- Schema-aware merge (KBT-016) ---

  /**
   * Merge the `incoming` todos object into `base` in place, reconciling
   * per-stream. `base` wins on any conflict (first-wins), which makes merge
   * idempotent and safe: re-merging never clobbers an existing record.
   *
   *   - unknown stream        -> copied wholesale into base
   *   - tasks{}               -> union by id; base keeps its version on conflict
   *   - order[]               -> union preserving base sequence, then new incoming ids
   *   - archived[]            -> union preserving base sequence, then new incoming ids
   *   - references{}          -> union; base wins on key conflict
   *   - counter               -> max(base, incoming)
   *   - prefix                -> base wins (kept if already present)
   *
   * The `order`/`archived` arrays may become supersets of what `tasks`
   * contains; _canonicalize (run on every _save) filters and de-dupes them,
   * so the persisted result is always well-formed.
   *
   * Returns { base, conflicts } where conflicts lists `stream/id` task ids
   * that existed in both and were kept from base.
   */
  static mergeStreams(base, incoming) {
    const conflicts = [];
    for (const [name, inc] of Object.entries(incoming || {})) {
      if (!inc || typeof inc !== 'object') continue;
      if (!base[name]) {
        base[name] = inc;
        continue;
      }
      const b = base[name];

      if (!b.prefix && inc.prefix) b.prefix = inc.prefix;
      b.counter = Math.max(b.counter || 0, inc.counter || 0);

      b.tasks = b.tasks || {};
      for (const [id, task] of Object.entries(inc.tasks || {})) {
        if (id in b.tasks) { conflicts.push(`${name}/${id}`); continue; }
        b.tasks[id] = task;
      }

      const unionSeq = (baseArr, incArr) => {
        const out = Array.isArray(baseArr) ? baseArr.slice() : [];
        for (const id of (Array.isArray(incArr) ? incArr : [])) {
          if (!out.includes(id)) out.push(id);
        }
        return out;
      };
      b.order = unionSeq(b.order, inc.order);
      b.archived = unionSeq(b.archived, inc.archived);

      if (inc.references) {
        b.references = { ...inc.references, ...(b.references || {}) };
      }
    }
    return { base, conflicts };
  }

  /**
   * Merge one or more source todo files, left to right, into a single todos
   * object. The first source is the base; each subsequent source is merged in
   * with mergeStreams (base wins). Returns { todos, conflicts }.
   */
  static async mergeFiles(sourcePaths) {
    if (!sourcePaths || sourcePaths.length === 0) {
      throw new Error('At least one source file is required.');
    }
    let merged = {};
    let conflicts = [];
    for (const p of sourcePaths) {
      const data = await new TodoManager(p)._load();
      const res = TodoManager.mergeStreams(merged, data);
      merged = res.base;
      conflicts = conflicts.concat(res.conflicts);
    }
    return { todos: merged, conflicts };
  }

  // --- Archive offload (KBT-015) ---

  /**
   * Move archived items (and their subtasks) out of the live file into a
   * separate archive file, shrinking the live ledger. The archive file is a
   * normal todo file (same schema) so its contents are readable on demand with
   * `todo archive list --file <archiveFile>` / `todo show --file <archiveFile>`.
   *
   * Merges into the archive with mergeStreams (archive wins on id conflict), so
   * repeated offloads into the same archive are safe and additive.
   *
   * @param {string[]} names   list names to offload; empty = every list
   * @param {string}   archiveFile  destination archive file path
   * @returns {{ moved:number, streams:string[], archiveFile:string, conflicts:string[] }}
   */
  async offload(names, archiveFile) {
    return this._withLock(async () => {
      const todos = await this._load();
      const targetNames = (names && names.length) ? names : Object.keys(todos);

      const incoming = {};
      let moved = 0;
      const streams = [];

      for (const nm of targetNames) {
        const list = todos[nm];
        if (!list || !list.tasks) {
          if (names && names.length) throw new Error(`Todo '${nm}' not found.`);
          continue;
        }
        this._canonicalize(list);
        const archIds = list.archived.slice();
        if (archIds.length === 0) continue;

        const tasksOut = {};
        for (const id of archIds) {
          if (list.tasks[id]) tasksOut[id] = list.tasks[id];
        }
        // Carry subtasks whose parent is being offloaded.
        for (const [id, t] of Object.entries(list.tasks)) {
          if (t.parent && archIds.includes(t.parent)) tasksOut[id] = t;
        }

        const outList = { prefix: list.prefix, counter: list.counter, order: [], archived: archIds.slice(), tasks: tasksOut };
        if (list.references) outList.references = { ...list.references };
        incoming[nm] = outList;
        streams.push(nm);

        // Strip the offloaded tasks out of the live list.
        for (const id of Object.keys(tasksOut)) delete list.tasks[id];
        list.archived = [];
        moved += archIds.length;
      }

      if (moved === 0) return { moved: 0, streams: [], archiveFile, conflicts: [] };

      const archManager = new TodoManager(archiveFile);
      const archTodos = await archManager._load();
      const { conflicts } = TodoManager.mergeStreams(archTodos, incoming);
      await archManager._save(archTodos);
      await this._save(todos);

      return { moved, streams, archiveFile, conflicts };
    });
  }
}
