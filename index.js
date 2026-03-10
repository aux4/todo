import { TodoManager } from './lib/TodoManager.js';
import { TodoUtils } from './lib/TodoUtils.js';
import { TodoParser } from './lib/TodoParser.js';

// Export library functions for programmatic use
export { TodoManager, TodoUtils, TodoParser };

// Main todo management functions
export async function listTodos(filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.list();
}

export async function viewTodo(name, filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.view(name);
}

export async function addTodo(name, items = [], filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.add(name, items);
}

export async function addTodoItem(name, item, filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.addItem(name, item);
}

export async function toggleTodoItem(name, itemIndex, filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.toggle(name, itemIndex);
}

export async function removeTodo(name, filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.remove(name);
}

export async function removeTodoItem(name, itemIndex, filePath = '.todo.json') {
  const manager = new TodoManager(filePath);
  return await manager.removeItem(name, itemIndex);
}

// CLI handling
(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('No command provided');
    process.exit(1);
  }

  const action = args[0];
  const actionArgs = args.slice(1);

  try {
    if (action === 'list') {
      await todoList(actionArgs);
    } else if (action === 'view') {
      await todoView(actionArgs);
    } else if (action === 'add') {
      await todoNew(actionArgs); // CLI action 'add' (from .aux4 'new' command) creates new todos
    } else if (action === 'addItem') {
      await todoAddItem(actionArgs); // CLI action 'addItem' (from .aux4 'add' command) adds items to existing todos
    } else if (action === 'complete') {
      await todoComplete(actionArgs); // CLI action 'complete' (from .aux4 'complete' command) replaces 'toggle'
    } else if (action === 'remove') {
      await todoRemove(actionArgs);
    } else if (action === 'removeItem') {
      await todoRemoveItem(actionArgs);
    } else {
      console.error(`Unknown action: ${action}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
})();

async function todoList(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';
  const todos = await listTodos(filePath);

  if (todos.length === 0) {
    console.log('No todos found.');
    return;
  }

  console.log('Todo Lists:');
  for (const todo of todos) {
    const progress = todo.total > 0 ? `(${todo.completed}/${todo.total})` : '(empty)';
    console.log(`  ${todo.name} ${progress}`);
  }
}

async function todoView(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 2) {
    console.error('Todo name is required');
    process.exit(1);
  }

  const name = args[1];

  const todo = await viewTodo(name, filePath);

  console.log(`## ${todo.title}`);
  if (todo.items.length === 0) {
    console.log('  (no items)');
    return;
  }

  const formattedItems = TodoUtils.formatItems(todo.items);
  for (const item of formattedItems) {
    console.log(`  ${item}`);
  }
}

async function todoNew(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 2) {
    console.error('Todo name is required');
    process.exit(1);
  }

  const name = args[1];
  let items = [];

  // Handle optional initial item
  if (args.length > 2) {
    const item = args[2];
    if (item && item.trim()) {
      items = [item];
    }
  }

  await addTodo(name, items, filePath);
  console.log(`Todo '${name}' created.`);
}

async function todoAddItem(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 3) {
    console.error('Todo name and item text are required');
    process.exit(1);
  }

  const name = args[1];
  const itemText = args[2] || '';

  if (!itemText.trim()) {
    console.error('Item text cannot be empty');
    process.exit(1);
  }

  await addTodoItem(name, itemText, filePath);
  console.log(`Item added to '${name}'.`);
}

async function todoComplete(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 3) {
    console.error('Todo name and item index are required');
    process.exit(1);
  }

  const name = args[1];
  const itemIndex = parseInt(args[2], 10);

  if (isNaN(itemIndex)) {
    console.error('Item index must be a number');
    process.exit(1);
  }

  // Get current state to determine behavior
  const currentTodo = await viewTodo(name, filePath);
  const currentItem = currentTodo.items[itemIndex];

  if (!currentItem) {
    console.error(`Item ${itemIndex} not found in '${name}'`);
    process.exit(1);
  }

  let targetStatus;
  let shouldToggle = false;

  if (args.length > 3 && args[3] !== '') {
    // Explicit status provided
    targetStatus = args[3] === 'true';
    shouldToggle = currentItem.completed !== targetStatus;
  } else {
    // No status provided - toggle current state
    targetStatus = !currentItem.completed;
    shouldToggle = true;
  }

  if (shouldToggle) {
    await toggleTodoItem(name, itemIndex, filePath);
  }

  const statusText = targetStatus ? 'completed' : 'pending';
  console.log(`Item ${itemIndex} in '${name}' marked as ${statusText}.`);
}

async function todoRemove(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 2) {
    console.error('Todo name is required');
    process.exit(1);
  }

  const name = args[1];

  await removeTodo(name, filePath);
  console.log(`Todo '${name}' removed.`);
}

async function todoRemoveItem(args) {
  const filePath = args.length > 0 ? args[0] : '.todo.json';

  if (args.length < 3) {
    console.error('Todo name and item index are required');
    process.exit(1);
  }

  const name = args[1];
  const itemIndex = parseInt(args[2], 10);

  if (isNaN(itemIndex)) {
    console.error('Item index must be a number');
    process.exit(1);
  }

  await removeTodoItem(name, itemIndex, filePath);
  console.log(`Item ${itemIndex} removed from '${name}'.`);
}