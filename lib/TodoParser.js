export class TodoParser {
  static parseContent(content) {
    if (!content || !content.trim()) return {};
    const data = JSON.parse(content);
    return this.migrate(data);
  }

  static generateContent(todos) {
    if (!todos || Object.keys(todos).length === 0) return '{}';
    return JSON.stringify(todos, null, 2);
  }

  /**
   * Migrate very old formats to the tasks-based structure in memory.
   * The v3 shape (order/archived arrays at the list level, no per-task
   * numeric order / archived flags) is materialised only on write, by
   * TodoManager._canonicalize during _save. Pure reads never rewrite the file.
   *
   * v0 (array):    { "list": [{ text, completed }] }
   * v1 (flat obj): { "list": { "hexid": { text, completed, order } } }
   * v2 (tasks):    { "list": { prefix, counter, tasks: { "PRE-001": { ... } } } }
   * v3 (current):  v2 + { order: [...ids], archived: [...ids] }
   */
  static migrate(data) {
    for (const name of Object.keys(data)) {
      if (name === '_meta') { delete data[name]; continue; }

      const val = data[name];

      // v0: array of items
      if (Array.isArray(val)) {
        data[name] = this._migrateFromArray(name, val);
        continue;
      }

      // v1: flat object without `tasks`/`prefix` keys (has items directly)
      if (typeof val === 'object' && !val.tasks && !val.prefix) {
        data[name] = this._migrateFromFlatObj(name, val);
        continue;
      }
    }

    return data;
  }

  static _derivePrefix(name) {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.substring(0, 3) || 'TSK';
  }

  static _migrateFromArray(name, items) {
    const prefix = this._derivePrefix(name);
    const tasks = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      delete item.id;
      if (item.order === undefined) item.order = i;
      const id = `${prefix}-${String(i + 1).padStart(3, '0')}`;
      tasks[id] = item;
    }
    return { prefix, counter: items.length, tasks };
  }

  static _migrateFromFlatObj(name, obj) {
    const prefix = this._derivePrefix(name);
    const tasks = {};
    const entries = Object.entries(obj).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    let counter = 0;
    const idMap = {};

    for (const [oldId, item] of entries) {
      counter++;
      const newId = `${prefix}-${String(counter).padStart(3, '0')}`;
      idMap[oldId] = newId;
      tasks[newId] = item;
    }

    // Remap parent references in subtasks
    for (const item of Object.values(tasks)) {
      if (item.parent && idMap[item.parent]) {
        item.parent = idMap[item.parent];
      }
    }

    return { prefix, counter, tasks };
  }
}
