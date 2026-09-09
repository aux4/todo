import { TodoManager } from './lib/TodoManager.js';
import { TodoUtils } from './lib/TodoUtils.js';
import { TodoParser } from './lib/TodoParser.js';

export { TodoManager, TodoUtils, TodoParser };

// --- CLI ---

const COMMANDS = {
  list:           todoList,
  view:           todoView,
  show:           todoShow,
  get:            todoShow,
  add:            todoNew,
  addItem:        todoAddItem,
  complete:       todoComplete,
  move:           todoMove,
  assign:         todoAssign,
  describe:       todoDescribe,
  rename:         todoRename,
  renameList:     todoRenameList,
  comment:        todoComment,
  comments:       todoComments,
  commentRemove:  todoCommentRemove,
  subtask:        todoSubtask,
  subtasks:       todoSubtasks,
  reference:      todoReference,
  remove:         todoRemove,
  removeItem:     todoRemoveItem,
  archiveAdd:     todoArchiveAdd,
  archiveRemove:  todoArchiveRemove,
  archiveList:    todoArchiveList,
  offload:        todoOffload,
  merge:          todoMerge,
};

// When `--format json` is passed, read/JSON-aware handlers print machine-readable JSON on stdout
// (for the aux4/platform UI) instead of the human-formatted CLI text. Parsed out of argv here so
// positional args are unaffected.
let OUT_JSON = false;

(async () => {
  const raw = process.argv.slice(2);
  const fi = raw.indexOf('--format');
  if (fi !== -1) { OUT_JSON = raw[fi + 1] === 'json'; raw.splice(fi, 2); }
  if (raw.length === 0) { console.error('No command provided'); process.exit(1); }

  const handler = COMMANDS[raw[0]];
  if (!handler) { console.error(`Unknown action: ${raw[0]}`); process.exit(1); }

  try {
    await handler(raw.slice(1));
  } catch (error) {
    if (OUT_JSON) { console.log(JSON.stringify({ error: error.message })); process.exit(0); }
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

// Derive the default archive file path from a todo file path:
// `.todo.json` -> `.todo.archive.json`, `foo.json` -> `foo.archive.json`, `foo` -> `foo.archive.json`.
function defaultArchivePath(filePath) {
  return `${filePath.replace(/\.json$/i, '')}.archive.json`;
}

// --- Command handlers ---

async function todoList(args) {
  const todos = await mgr(args).list();
  if (OUT_JSON) { console.log(JSON.stringify(todos)); return; }
  if (todos.length === 0) { console.log('No todos found.'); return; }

  console.log('Todo Lists:');
  for (const t of todos) {
    let progress;
    if (t.total === 0 && !t.archived) {
      progress = '(empty)';
    } else {
      const tail = t.archived > 0 ? `, ${t.archived} archived` : '';
      progress = `(${t.completed}/${t.total}${tail})`;
    }
    console.log(`  [${t.prefix}] ${t.name} ${progress}`);
  }
}

function resolveViewStatuses(statusArg) {
  if (statusArg === '') return ['open', 'doing'];
  if (statusArg === 'all') return ['open', 'doing', 'done'];
  if (['open', 'doing', 'done'].includes(statusArg)) return [statusArg];
  throw new Error(`Invalid status '${statusArg}'. Must be one of: open, doing, done, all.`);
}

async function todoView(args) {
  requireArgs(args, 2, 'Todo name is required');
  const name = arg(args, 1);
  const show = resolveViewStatuses(arg(args, 2));

  const todo = await mgr(args).view(name);
  const items = todo.items.filter(it => show.includes(it.status));

  if (OUT_JSON) { console.log(JSON.stringify({ ...todo, items })); return; }

  console.log(`## ${todo.title} [${todo.prefix}]`);
  if (items.length === 0) { console.log('  (no items)'); return; }
  for (const it of items) console.log(`  ${TodoUtils.formatItemLine(it)}`);
}

async function todoShow(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const name = arg(args, 1);
  const id = arg(args, 2);
  const full = arg(args, 3) === 'true';
  const commentsN = parseInt(arg(args, 4), 10);
  const cN = Number.isInteger(commentsN) && commentsN >= 0 ? commentsN : 3;

  const r = await mgr(args).get(name, id);
  if (OUT_JSON) { console.log(JSON.stringify(r)); return; }

  const marker = TodoUtils.statusMarker(r.status);
  let statusLine = `Status: ${r.status} ${marker}`;
  if (r.assignee) statusLine += `   Assignee: @${r.assignee}`;
  if (r.subtaskTotal > 0) statusLine += `   Subtasks: ${r.subtaskCompleted}/${r.subtaskTotal}`;

  const out = [`## ${name} > ${id}: ${r.text}`, statusLine];

  if (r.description) {
    out.push('');
    out.push('Description:');
    out.push(TodoUtils.descBody(r.description, full));
  }

  out.push('');
  const comments = r.comments || [];
  if (comments.length === 0) {
    out.push('Comments: (none)');
  } else {
    const shown = Math.min(cN, comments.length);
    out.push(`Comments (showing last ${shown} of ${comments.length}):`);
    const newest = comments.slice().reverse().slice(0, shown);
    for (const c of newest) out.push(TodoUtils.formatCommentLine(c));
  }

  console.log(out.join('\n'));
}

async function todoMove(args) {
  requireArgs(args, 4, 'Todo name, item id, and status are required');
  const name = arg(args, 1);
  const result = await mgr(args).move(name, arg(args, 2), arg(args, 3));
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`${result.id} in '${name}' moved to ${result.status}.`);
}

async function todoCommentRemove(args) {
  requireArgs(args, 4, 'Todo name, item id, and comment index are required');
  const result = await mgr(args).commentRemove(arg(args, 1), arg(args, 2), arg(args, 3), arg(args, 4));
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`Comment removed from ${arg(args, 2)} in '${arg(args, 1)}'.`);
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
    const todos = await m._load();
    const item = m._requireItem(todos, name, id);
    if (item.completed !== targetStatus) await m.toggle(name, id);
    console.log(`${id} in '${name}' marked as ${targetStatus ? 'completed' : 'pending'}.`);
  } else {
    const nowCompleted = await m.toggle(name, id);
    console.log(`${id} in '${name}' marked as ${nowCompleted ? 'completed' : 'pending'}.`);
  }
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

async function todoRename(args) {
  requireArgs(args, 4, 'Todo name, item id, and new text are required');
  const [name, id, text] = [arg(args, 1), arg(args, 2), arg(args, 3)];
  const result = await mgr(args).rename(name, id, text);
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`${id} in '${name}' renamed.`);
}

async function todoRenameList(args) {
  requireArgs(args, 3, 'Current and new list names are required');
  const [oldName, newName] = [arg(args, 1), arg(args, 2)];
  const result = await mgr(args).renameList(oldName, newName);
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`Todo '${oldName}' renamed to '${newName}'.`);
}

async function todoComment(args) {
  requireArgs(args, 5, 'Todo name, item id, author, and message are required');
  const [name, id, author, message] = [arg(args, 1), arg(args, 2), arg(args, 3), arg(args, 4)];
  await mgr(args).comment(name, id, author, message);
  console.log(`Comment added to ${id} in '${name}'.`);
}

async function todoComments(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const name = arg(args, 1);
  const id = arg(args, 2);
  const limitRaw = parseInt(arg(args, 3), 10);
  const offsetRaw = parseInt(arg(args, 4), 10);
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : 3;
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const r = await mgr(args).get(name, id);
  const comments = r.comments || [];

  if (OUT_JSON) {
    console.log(JSON.stringify({ title: `${name} > ${id}: ${r.text}`, comments }));
    return;
  }

  const total = comments.length;
  const newest = comments.slice().reverse();
  const page = newest.slice(offset, offset + limit);
  const shown = page.length;
  const start = shown === 0 ? 0 : offset + 1;
  const end = shown === 0 ? 0 : offset + shown;

  console.log(`## ${name} > ${id}: ${r.text} — showing ${start}–${end} of ${total}`);
  if (page.length === 0) { console.log('  (no comments)'); return; }
  for (const c of page) console.log(TodoUtils.formatCommentLine(c));
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
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`## ${result.title}`);
  if (result.items.length === 0) { console.log('  (no subtasks)'); return; }
  for (const it of result.items) console.log(`  ${TodoUtils.formatItemLine(it)}`);
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

async function todoArchiveAdd(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const [name, id] = [arg(args, 1), arg(args, 2)];
  await mgr(args).archiveAdd(name, id);
  console.log(`${id} archived in '${name}'.`);
}

async function todoArchiveRemove(args) {
  requireArgs(args, 3, 'Todo name and item id are required');
  const [name, id] = [arg(args, 1), arg(args, 2)];
  await mgr(args).archiveRemove(name, id);
  console.log(`${id} unarchived in '${name}'.`);
}

async function todoArchiveList(args) {
  requireArgs(args, 2, 'Todo name is required');
  const result = await mgr(args).archiveList(arg(args, 1));
  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }
  console.log(`## ${result.title}`);
  if (result.items.length === 0) { console.log('  (no archived items)'); return; }
  for (const it of result.items) console.log(`  ${TodoUtils.formatItemLine(it)}`);
}

// --- Archive offload (KBT-015) ---

async function todoOffload(args) {
  const name = arg(args, 1);
  const into = arg(args, 2);
  const m = mgr(args);
  const archiveFile = into || defaultArchivePath(m.filePath);
  const names = name ? [name] : [];
  const result = await m.offload(names, archiveFile);

  if (OUT_JSON) { console.log(JSON.stringify(result)); return; }

  if (result.moved === 0) {
    console.log(`Nothing to offload${name ? ` in '${name}'` : ''}.`);
    return;
  }
  const streams = result.streams.length ? ` from ${result.streams.join(', ')}` : '';
  console.log(`Offloaded ${result.moved} archived item(s)${streams} to ${result.archiveFile}.`);
}

// --- Schema-aware merge (KBT-016) ---

async function todoMerge(args) {
  let into = '';
  const sources = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--into') { into = args[++i] || ''; }
    else if (args[i] === '--source') { const v = args[++i]; if (v) sources.push(v); }
  }
  if (sources.length === 0) throw new Error('At least one --source file is required.');

  const { todos, conflicts } = await TodoManager.mergeFiles(sources);

  if (into) {
    const target = new TodoManager(into);
    await target._withLock(async () => { await target._save(todos); });
  } else {
    const m = new TodoManager();
    for (const key of Object.keys(todos)) m._canonicalize(todos[key]);
    console.log(TodoParser.generateContent(todos));
    return;
  }

  if (OUT_JSON) {
    console.log(JSON.stringify({ into, sources, streams: Object.keys(todos), conflicts }));
    return;
  }
  const c = conflicts.length ? ` (${conflicts.length} id conflict(s) kept from base)` : '';
  console.log(`Merged ${sources.length} file(s) into ${into}${c}.`);
}
