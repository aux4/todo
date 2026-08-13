import { TodoUtils } from './TodoUtils.js';
import { TodoParser } from './TodoParser.js';
import { dirname, resolve } from 'path';

export const TASK_STATUSES = ['open', 'doing', 'done'];

export class TodoManager {
  constructor(filePath = '.todo.json') {
    this.filePath = filePath;
  }

  async _load() {
    if (!await TodoUtils.fileExists(this.filePath)) return {};
    const content = await TodoUtils.readFile(this.filePath);
    if (!content || !content.trim()) return {};

    const raw = JSON.parse(content);
    const migrated = TodoParser.needsMigration(raw);
    const todos = TodoParser.migrate(raw);

    // Transparently upgrade old-shape files on first access (best effort).
    if (migrated) {
      try { await this._save(todos); } catch (_) { /* read-only fs / race */ }
    }

    return todos;
  }

  async _save(todos) {
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

  // --- Status handling ---

  /**
   * Derive an item's status. When a task has an explicit `status` field it is
   * used; otherwise it is derived from `completed` for backward compatibility
   * with files written before the status field existed (true -> done, false -> open).
   */
  _deriveStatus(item) {
    if (TASK_STATUSES.includes(item.status)) return item.status;
    return item.completed ? 'done' : 'open';
  }

  _idNum(id) {
    const m = /(\d+)\s*$/.exec(id || '');
    return m ? parseInt(m[1], 10) : 0;
  }

  // --- Validation ---

  _requireList(todos, name) {
    if (!(name in todos)) throw new Error(`Todo '${name}' not found.`);
    return todos[name];
  }

  _requireItem(todos, name, id) {
    const list = this._requireList(todos, name);
    if (!(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
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

  /**
   * Resolve a task ID that may live in a referenced file.
   * Returns { manager, listName, item } or throws.
   */
  async _resolveTask(todos, name, id) {
    const list = this._requireList(todos, name);
    const prefix = this._parsePrefix(id);

    // Local task
    if (!prefix || prefix === list.prefix) {
      if (!(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
      return { manager: this, listName: name, item: list.tasks[id], todos };
    }

    // Foreign task via reference
    const ref = this._resolveRef(list, prefix);
    if (!ref) throw new Error(`Unknown prefix '${prefix}'. Add a reference with: todo reference ${name} --prefix ${prefix} --target <file>#<list>`);

    const foreignPath = this._resolveFilePath(ref.file);
    const foreignManager = new TodoManager(foreignPath);
    const foreignTodos = await foreignManager._load();

    // Find the list with matching prefix
    let foreignListName = ref.listName;
    if (!foreignListName) {
      foreignListName = Object.keys(foreignTodos).find(n => foreignTodos[n].prefix === prefix);
    }

    if (!foreignListName || !(foreignListName in foreignTodos)) {
      throw new Error(`Referenced list for prefix '${prefix}' not found in '${ref.file}'.`);
    }

    const foreignList = foreignTodos[foreignListName];
    if (!(id in foreignList.tasks)) {
      throw new Error(`Item '${id}' not found in '${foreignListName}' (${ref.file}).`);
    }

    return { manager: foreignManager, listName: foreignListName, item: foreignList.tasks[id], todos: foreignTodos };
  }

  // --- Query helpers ---

  _ensureShape(list) {
    if (!Array.isArray(list.order)) list.order = [];
    if (!Array.isArray(list.archived)) list.archived = [];
    return list;
  }

  /**
   * Active top-level items, in display order. Iterates `order` (the source of
   * truth) so archived items are absent by construction.
   */
  _orderedTopLevel(list) {
    this._ensureShape(list);
    return list.order
      .filter(id => id in list.tasks && list.tasks[id].type !== 'subtask')
      .map(id => ({ id, ...list.tasks[id], status: this._deriveStatus(list.tasks[id]) }));
  }

  _archivedTopLevel(list) {
    this._ensureShape(list);
    return list.archived
      .filter(id => id in list.tasks && list.tasks[id].type !== 'subtask')
      .map(id => ({ id, ...list.tasks[id], status: this._deriveStatus(list.tasks[id]) }));
  }

  _subtaskItems(tasks, parentId) {
    return Object.entries(tasks)
      .filter(([, item]) => item.type === 'subtask' && item.parent === parentId)
      .map(([id, item]) => ({ id, ...item, status: this._deriveStatus(item) }))
      .sort((a, b) => this._idNum(a.id) - this._idNum(b.id));
  }

  _filterByStatus(items, status) {
    if (!status || status === '') return items.filter(i => i.status !== 'done');
    if (status === 'all') return items;
    if (TASK_STATUSES.includes(status)) return items.filter(i => i.status === status);
    throw new Error(`Invalid status '${status}'. Must be one of: open, doing, done, all.`);
  }

  _enrichWithSubtasks(tasks, items) {
    return items.map(item => {
      const subs = this._subtaskItems(tasks, item.id);
      if (subs.length === 0) return item;
      return {
        ...item,
        subtaskTotal: subs.length,
        subtaskCompleted: subs.filter(s => s.completed).length
      };
    });
  }

  // --- Read operations ---

  async list() {
    const todos = await this._load();
    return Object.entries(todos).map(([name, list]) => {
      const top = this._orderedTopLevel(list);
      return {
        name,
        prefix: list.prefix,
        total: top.length,
        completed: top.filter(i => i.completed).length,
        archived: (list.archived || []).length
      };
    });
  }

  /**
   * Slim index of a list. Iterates `order` (archived excluded by construction).
   * `status` filters: unset -> open+doing (hide done); 'all' -> everything;
   * a single status value -> only that status.
   */
  async view(name, { status } = {}) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const items = this._enrichWithSubtasks(list.tasks, this._orderedTopLevel(list));
    return { title: name, prefix: list.prefix, items: this._filterByStatus(items, status) };
  }

  /**
   * Single-item detail — the by-ID read primitive. Returns the item header,
   * a description chunk (truncated unless `full`), and the last `commentsLimit`
   * comments newest-first.
   */
  async show(name, id, { full = false, commentsLimit = 3 } = {}) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    if (!(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
    const item = list.tasks[id];
    const subs = item.type === 'subtask' ? [] : this._subtaskItems(list.tasks, id);
    const sorted = this._sortCommentsDesc(item.comments);
    return {
      name,
      id,
      status: this._deriveStatus(item),
      text: item.text,
      assignee: item.assignee,
      description: item.description,
      archived: (list.archived || []).includes(id),
      subtaskTotal: subs.length,
      subtaskCompleted: subs.filter(s => s.completed).length,
      comments: sorted.slice(0, commentsLimit),
      commentTotal: sorted.length,
      full
    };
  }

  async viewSubtasks(name, parentId) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, parentId);
    const subs = this._subtaskItems(todos[name].tasks, parentId);
    return { title: `${name} > ${parentId}: ${item.text}`, items: subs };
  }

  _sortCommentsDesc(comments) {
    return (comments || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Comments, newest-first, paginated. `limit`/`offset` window the sorted list.
   */
  async viewComments(name, id, { limit = 3, offset = 0 } = {}) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, id);
    const all = this._sortCommentsDesc(item.comments);
    return {
      title: `${name} > ${id}: ${item.text}`,
      comments: all.slice(offset, offset + limit),
      total: all.length,
      offset,
      limit
    };
  }

  async viewArchived(name) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const items = this._enrichWithSubtasks(list.tasks, this._archivedTopLevel(list));
    return { title: name, prefix: list.prefix, items };
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

      const list = { prefix, counter: 0, tasks: {}, order: [], archived: [] };
      for (const text of items) {
        const id = this._nextId(list);
        list.tasks[id] = this._createItem(text, { assignee, description });
        list.order.push(id);
      }

      todos[name] = list;
      await this._save(todos);
      return { title: name, prefix, items: this._orderedTopLevel(list) };
    });
  }

  async addItem(name, item, { assignee, description } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      this._ensureShape(list);
      const id = this._nextId(list);
      list.tasks[id] = this._createItem(item, { assignee, description });
      list.order.push(id);

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
      let targetListName = name;
      let targetList = list;

      if (parentPrefix && parentPrefix !== list.prefix) {
        const ref = this._resolveRef(list, parentPrefix);
        if (ref) {
          const foreignPath = this._resolveFilePath(ref.file);
          targetManager = new TodoManager(foreignPath);
          targetTodos = await targetManager._load();
          targetListName = ref.listName || Object.keys(targetTodos).find(n => targetTodos[n].prefix === parentPrefix);
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

  /**
   * Move a task (or subtask) to a status: open, doing, or done.
   * Keeps the `completed` flag in sync (done <-> completed true; open/doing <-> false).
   */
  async move(name, id, status) {
    if (!TASK_STATUSES.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${TASK_STATUSES.join(', ')}.`);
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

  async assign(name, id, assignee) {
    return this._withLock(async () => {
      const todos = await this._load();
      const item = this._requireItem(todos, name, id);
      if (assignee) { item.assignee = assignee; } else { delete item.assignee; }
      await this._save(todos);
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
      const list = todos[name];
      const tasks = list.tasks;

      const removeChildren = (parentId) => {
        const children = this._subtaskItems(tasks, parentId);
        for (const child of children) {
          removeChildren(child.id);
          delete tasks[child.id];
        }
      };

      removeChildren(id);
      delete tasks[id];

      this._ensureShape(list);
      const oi = list.order.indexOf(id);
      if (oi !== -1) list.order.splice(oi, 1);
      const ai = list.archived.indexOf(id);
      if (ai !== -1) list.archived.splice(ai, 1);

      await this._save(todos);
    });
  }

  // --- Archive operations ---

  async archiveAdd(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      if (!(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
      if (list.tasks[id].type === 'subtask') {
        throw new Error(`Cannot archive a subtask. Archive its parent instead.`);
      }
      this._ensureShape(list);
      if (list.archived.includes(id)) throw new Error(`Item '${id}' is already archived.`);

      const oi = list.order.indexOf(id);
      if (oi !== -1) list.order.splice(oi, 1);
      list.archived.push(id);

      await this._save(todos);
      return { id };
    });
  }

  async archiveRemove(name, id) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      if (!(id in list.tasks)) throw new Error(`Item '${id}' not found in '${name}'.`);
      this._ensureShape(list);
      const ai = list.archived.indexOf(id);
      if (ai === -1) throw new Error(`Item '${id}' is not archived.`);

      list.archived.splice(ai, 1);
      if (!list.order.includes(id)) list.order.push(id);

      await this._save(todos);
      return { id };
    });
  }
}
