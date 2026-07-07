import { TodoManager } from './lib/TodoManager.js';
import { TodoUtils } from './lib/TodoUtils.js';
import { TodoParser } from './lib/TodoParser.js';

export { TodoManager, TodoUtils, TodoParser };

// --- CLI ---

const COMMANDS = {
  list:       todoList,
  view:       todoView,
  add:        todoNew,
  addItem:    todoAddItem,
  complete:   todoComplete,
  move:       todoMove,
  assign:     todoAssign,
  describe:   todoDescribe,
  comment:    todoComment,
  comments:   todoComments,
  subtask:    todoSubtask,
  subtasks:   todoSubtasks,
  reference:  todoReference,
  remove:     todoRemove,
  removeItem: todoRemoveItem,
};

(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) { console.error('No command provided'); process.exit(1); }

  const handler = COMMANDS[args[0]];
  if (!handler) { console.error(`Unknown action: ${args[0]}`); process.exit(1); }

  try {
    await handler(args.slice(1));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();

// --- Helpers ---

function arg(args, i) { return args[i] || ''; }

function requireArgs(args, min, message) {
  if (args.length < min) throw new Error(message);
}

function mgr(args) { return new TodoManager(arg(args, 0) || '.todo.json'); }

// --- Command handlers ---

async function todoList(args) {
  const todos = await mgr(args).list();
  if (todos.length === 0) { console.log('No todos found.'); return; }

  console.log('Todo Lists:');
  for (const t of todos) {
    const progress = t.total > 0 ? `(${t.completed}/${t.total})` : '(empty)';
    console.log(`  [${t.prefix}] ${t.name} ${progress}`);
  }
}

async function todoView(args) {
  requireArgs(args, 2, 'Todo name is required');
  const todo = await mgr(args).view(arg(args, 1));

  console.log(`## ${todo.title} [${todo.prefix}]`);
  if (todo.items.length === 0) { console.log('  (no items)'); return; }

  for (const line of TodoUtils.formatItems(todo.items)) console.log(`  ${line}`);
}

async function todoNew(args) {
  requireArgs(args, 3, 'Todo name and prefix are required');
  const name = arg(args, 1);
  const prefix = arg(args, 2);
  const item = arg(args, 3);
  const assignee = arg(args, 4);
  const description = arg(args, 5);

  const items = item && item.trim() ? [item] : [];
  await mgr(args).add(name, prefix, items, { assignee, description });
  console.log(`Todo '${name}' [${prefix}] created.`);
}

async function todoAddItem(args) {
  requireArgs(args, 3, 'Todo name and item text are required');
  const name = arg(args, 1);
  const item = arg(args, 2);
  if (!item.trim()) throw new Error('Item text cannot be empty');

  const result = await mgr(args).addItem(name, item, { assignee: arg(args, 3), description: arg(args, 4) });
  console.log(`${result.id} added to '${name}'.`);
}

async function todoComplete(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const [, name, id, status] = [arg(args, 0), arg(args, 1), arg(args, 2), arg(args, 3)];
  const m = mgr(args);

  if (status !== '') {
    const targetStatus = status === 'true';
    await m.move(name, id, targetStatus ? 'done' : 'open');
    console.log(`${id} in '${name}' marked as ${targetStatus ? 'completed' : 'pending'}.`);
  } else {
    const nowCompleted = await m.toggle(name, id);
    console.log(`${id} in '${name}' marked as ${nowCompleted ? 'completed' : 'pending'}.`);
  }
}

async function todoMove(args) {
  requireArgs(args, 4, 'Todo name, item id, and status are required');
  const [name, id, status] = [arg(args, 1), arg(args, 2), arg(args, 3)];
  const result = await mgr(args).move(name, id, status);
  console.log(`${id} in '${name}' moved to ${result.status}.`);
}

async function todoAssign(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const [name, id, assignee] = [arg(args, 1), arg(args, 2), arg(args, 3)];
  await mgr(args).assign(name, id, assignee);
  console.log(assignee
    ? `${id} in '${name}' assigned to ${assignee}.`
    : `${id} in '${name}' unassigned.`);
}

async function todoDescribe(args) {
  requireArgs(args, 4, 'Todo name, item id, and description are required');
  const [name, id, desc] = [arg(args, 1), arg(args, 2), arg(args, 3)];
  await mgr(args).describe(name, id, desc);
  console.log(`${id} in '${name}' description updated.`);
}

async function todoComment(args) {
  requireArgs(args, 5, 'Todo name, item id, author, and message are required');
  const [name, id, author, message] = [arg(args, 1), arg(args, 2), arg(args, 3), arg(args, 4)];
  await mgr(args).comment(name, id, author, message);
  console.log(`Comment added to ${id} in '${name}'.`);
}

async function todoComments(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const result = await mgr(args).viewComments(arg(args, 1), arg(args, 2));
  console.log(`## ${result.title}`);
  for (const line of TodoUtils.formatComments(result.comments)) console.log(line);
}

async function todoSubtask(args) {
  requireArgs(args, 4, 'Todo name, item id, and subtask text are required');
  const [name, id, item, assignee, desc] = [arg(args, 1), arg(args, 2), arg(args, 3), arg(args, 4), arg(args, 5)];
  const result = await mgr(args).addSubtask(name, id, item, { assignee, description: desc });
  console.log(`${result.id} added as subtask of ${id} in '${name}'.`);
}

async function todoSubtasks(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const result = await mgr(args).viewSubtasks(arg(args, 1), arg(args, 2));
  console.log(`## ${result.title}`);
  if (result.items.length === 0) { console.log('  (no subtasks)'); return; }
  for (const line of TodoUtils.formatItems(result.items)) console.log(`  ${line}`);
}

async function todoReference(args) {
  requireArgs(args, 4, 'Todo name, prefix, and target are required');
  const [name, prefix, target] = [arg(args, 1), arg(args, 2), arg(args, 3)];

  if (!/^[A-Z]{2,10}$/.test(prefix)) throw new Error(`Prefix must be 2-10 uppercase letters. Got: '${prefix}'.`);

  await mgr(args).addReference(name, prefix, target);
  console.log(`Reference ${prefix} -> ${target} added to '${name}'.`);
}

async function todoRemove(args) {
  requireArgs(args, 2, 'Todo name is required');
  await mgr(args).remove(arg(args, 1));
  console.log(`Todo '${arg(args, 1)}' removed.`);
}

async function todoRemoveItem(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const [name, id] = [arg(args, 1), arg(args, 2)];
  await mgr(args).removeItem(name, id);
  console.log(`${id} removed from '${name}'.`);
}
