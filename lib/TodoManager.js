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
    return TodoParser.parseContent(content);
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

  _createItem(text, { assignee, description } = {}) {
    const entry = { text, completed: false, status: 'open' };
    if (assignee) entry.assignee = assignee;
    if (description) entry.description = description;
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
    const isSub = id => tasks[id] && tasks[id].type === 'subtask';

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
      .filter(([, item]) => item.type === 'subtask' && item.parent === parentId)
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
        subtaskTotal: subs.length,
        subtaskCompleted: subs.filter(s => s.completed).length,
        hasDescription: !!(item.description && String(item.description).length),
        commentCount: item.comments ? item.comments.length : 0
      };
    });
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

  async view(name) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const items = this._enrich(list, this._topActive(list));
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
      comments: item.comments || [],
      subtaskTotal: subs.length,
      subtaskCompleted: subs.filter(s => s.completed).length
    };
  }

  async archiveList(name) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const { archivedIds } = this._computeOrder(list);
    const items = this._enrich(list, archivedIds.map(id => ({ id, ...list.tasks[id] })));
    return { title: `${name} [${list.prefix}] (archived)`, prefix: list.prefix, items };
  }

  // --- Write operations ---

  async add(name, prefix, items = [], { assignee, description } = {}) {
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
        list.tasks[id] = this._createItem(text, { assignee, description });
      }

      todos[name] = list;
      await this._save(todos);
      return { title: name, prefix };
    });
  }

  async addItem(name, item, { assignee, description } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      const id = this._nextId(list);
      list.tasks[id] = this._createItem(item, { assignee, description });

      await this._save(todos);
      return { id };
    });
  }

  async addSubtask(name, parentId, item, { assignee, description } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const parent = this._requireItem(todos, name, parentId);

      if (parent.type === 'subtask') {
        throw new Error(`Cannot add subtask to a subtask. Parent '${parentId}' is already a subtask.`);
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
      const entry = this._createItem(item, { assignee, description });
      entry.type = 'subtask';
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
      if (item.type === 'subtask') {
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

  async removeItem(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      this._requireItem(todos, name, id);
      const tasks = todos[name].tasks;

      const removeChildren = (parentId) => {
        const children = this._subtaskItems(tasks, parentId);
        for (const child of children) {
          removeChildren(child.id);
          delete tasks[child.id];
        }
      };

      removeChildren(id);
      delete tasks[id];

      await this._save(todos);
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
          if (t.type === 'subtask' && archIds.includes(t.parent)) tasksOut[id] = t;
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
