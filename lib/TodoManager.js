import { TodoUtils } from './TodoUtils.js';
import { TodoParser } from './TodoParser.js';
import { dirname, resolve } from 'path';

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

  _createItem(text, order, { assignee, description } = {}) {
    const entry = { text, completed: false, order };
    if (assignee) entry.assignee = assignee;
    if (description) entry.description = description;
    return entry;
  }

  _nextOrder(tasks) {
    let max = 0;
    for (const item of Object.values(tasks)) {
      if (item.order !== undefined && item.order >= max) max = item.order + 1;
    }
    return max;
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

  _topLevelItems(tasks) {
    return Object.entries(tasks)
      .filter(([, item]) => item.type !== 'subtask')
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  _subtaskItems(tasks, parentId) {
    return Object.entries(tasks)
      .filter(([, item]) => item.type === 'subtask' && item.parent === parentId)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
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
      const top = this._topLevelItems(list.tasks);
      return {
        name,
        prefix: list.prefix,
        total: top.length,
        completed: top.filter(i => i.completed).length
      };
    });
  }

  async view(name) {
    const todos = await this._load();
    const list = this._requireList(todos, name);
    const items = this._enrichWithSubtasks(list.tasks, this._topLevelItems(list.tasks));
    return { title: name, prefix: list.prefix, items };
  }

  async viewSubtasks(name, parentId) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, parentId);
    const subs = this._subtaskItems(todos[name].tasks, parentId);
    return { title: `${name} > ${parentId}: ${item.text}`, items: subs };
  }

  async viewComments(name, id) {
    const todos = await this._load();
    const item = this._requireItem(todos, name, id);
    return { title: `${name} > ${id}: ${item.text}`, comments: item.comments };
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

      const list = { prefix, counter: 0, tasks: {} };
      for (const text of items) {
        const id = this._nextId(list);
        list.tasks[id] = this._createItem(text, this._nextOrder(list.tasks), { assignee, description });
      }

      todos[name] = list;
      await this._save(todos);
      return { title: name, prefix, items: this._topLevelItems(list.tasks) };
    });
  }

  async addItem(name, item, { assignee, description } = {}) {
    return this._withLock(async () => {
      const todos = await this._load();
      const list = this._requireList(todos, name);
      const id = this._nextId(list);
      list.tasks[id] = this._createItem(item, this._nextOrder(list.tasks), { assignee, description });

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
      const entry = this._createItem(item, this._nextOrder(targetList.tasks), { assignee, description });
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
      await this._save(todos);
      return item.completed;
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
}
