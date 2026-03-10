import { TodoUtils } from './TodoUtils.js';
import { TodoParser } from './TodoParser.js';

export class TodoManager {
  constructor(filePath = '.todo.json') {
    this.filePath = filePath;
  }

  async _load() {
    if (!await TodoUtils.fileExists(this.filePath)) {
      return {};
    }
    const content = await TodoUtils.readFile(this.filePath);
    return TodoParser.parseContent(content);
  }

  async _save(todos) {
    const content = TodoParser.generateContent(todos);
    await TodoUtils.writeFile(this.filePath, content);
  }

  /**
   * List all todos (just the titles)
   */
  async list() {
    const todos = await this._load();
    return Object.keys(todos).map(name => ({
      name,
      total: todos[name].length,
      completed: todos[name].filter(item => item.completed).length
    }));
  }

  /**
   * View a specific todo by name
   */
  async view(name) {
    const todos = await this._load();

    if (!(name in todos)) {
      throw new Error(`Todo '${name}' not found.`);
    }

    return { title: name, items: todos[name] };
  }

  /**
   * Add a new todo list
   */
  async add(name, items = []) {
    const todos = await this._load();

    if (name in todos) {
      throw new Error(`Todo '${name}' already exists.`);
    }

    todos[name] = items.map(item => ({
      text: item,
      completed: false
    }));

    await this._save(todos);

    return { title: name, items: todos[name] };
  }

  /**
   * Add an item to an existing todo
   */
  async addItem(name, item) {
    const todos = await this._load();

    if (!(name in todos)) {
      throw new Error(`Todo '${name}' not found.`);
    }

    todos[name].push({
      text: item,
      completed: false
    });

    await this._save(todos);

    return { title: name, items: todos[name] };
  }

  /**
   * Mark an item as completed or uncompleted
   */
  async toggle(name, itemIndex) {
    const todos = await this._load();

    if (!(name in todos)) {
      throw new Error(`Todo '${name}' not found.`);
    }

    if (itemIndex < 0 || itemIndex >= todos[name].length) {
      throw new Error(`Item index ${itemIndex} is out of range.`);
    }

    todos[name][itemIndex].completed = !todos[name][itemIndex].completed;

    await this._save(todos);

    return { title: name, items: todos[name] };
  }

  /**
   * Remove a todo list
   */
  async remove(name) {
    const todos = await this._load();

    if (!(name in todos)) {
      throw new Error(`Todo '${name}' not found.`);
    }

    delete todos[name];
    await this._save(todos);

    return true;
  }

  /**
   * Remove an item from a todo
   */
  async removeItem(name, itemIndex) {
    const todos = await this._load();

    if (!(name in todos)) {
      throw new Error(`Todo '${name}' not found.`);
    }

    if (itemIndex < 0 || itemIndex >= todos[name].length) {
      throw new Error(`Item index ${itemIndex} is out of range.`);
    }

    todos[name].splice(itemIndex, 1);

    await this._save(todos);

    return { title: name, items: todos[name] };
  }
}
