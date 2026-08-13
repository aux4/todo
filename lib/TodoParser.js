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
   * Detect whether the raw parsed JSON needs migration to the current
   * storage shape. Must be called BEFORE `migrate` (which mutates in place).
   * When true, callers should persist the migrated result back to disk.
   */
  static needsMigration(data) {
    for (const [name, val] of Object.entries(data)) {
      if (name === '_meta') return true;

      // v0: array of items
      if (Array.isArray(val)) return true;
      if (typeof val !== 'object' || val === null) continue;

      // v1: flat object without prefix/tasks
      if (!val.tasks || !val.prefix) return true;

      // v2 -> v3: order/archived arrays + no numeric per-item order
      if (!Array.isArray(val.order)) return true;
      if (!Array.isArray(val.archived)) return true;
      for (const item of Object.values(val.tasks)) {
        if ('order' in item) return true;
        if ('archived' in item) return true;
      }
    }
    return false;
  }

  /**
   * Migrate old formats to current structure.
   *
   * v0 (array):    { "list": [{ text, completed }] }
   * v1 (flat obj): { "list": { "hexid": { text, completed, order } } }
   * v2:            { "list": { prefix, counter, tasks: { "PRE-001": { ..., order } } } }
   * v3 (current):  { "list": { prefix, counter, tasks, order:[ids], archived:[ids] } }
   */
  static migrate(data) {
    for (const name of Object.keys(data)) {
      if (name === '_meta') { delete data[name]; continue; }

      const val = data[name];

      // v0: array of items
      if (Array.isArray(val)) {
        data[name] = this._migrateFromArray(name, val);
      }
      // v1: flat object without `tasks` key (has items directly)
      else if (typeof val === 'object' && val !== null && !val.tasks && !val.prefix) {
        data[name] = this._migrateFromFlatObj(name, val);
      }

      // v2 -> v3: build order/archived arrays, drop redundant numeric order field
      if (data[name] && typeof data[name] === 'object' && data[name].tasks) {
        this._normalizeShape(data[name]);
      }
    }

    return data;
  }

  /**
   * Ensure a list carries `order` and `archived` id arrays and no longer keeps
   * a redundant numeric `order` field on individual tasks. Rebuilds `order`
   * from the legacy numeric field (top-level, non-subtask), honoring any legacy
   * `item.archived === true` markers by routing those ids into `archived`.
   */
  static _normalizeShape(list) {
    if (!Array.isArray(list.order)) {
      const topLevel = Object.entries(list.tasks)
        .filter(([, item]) => item.type !== 'subtask')
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

      const order = [];
      const archived = Array.isArray(list.archived) ? list.archived.slice() : [];

      for (const [id, item] of topLevel) {
        if (item.archived === true) {
          if (!archived.includes(id)) archived.push(id);
        } else {
          order.push(id);
        }
      }

      list.order = order;
      list.archived = archived;
    } else if (!Array.isArray(list.archived)) {
      list.archived = [];
    }

    // Drop the now-redundant numeric order field and any legacy archived flag.
    for (const item of Object.values(list.tasks)) {
      delete item.order;
      delete item.archived;
    }
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
