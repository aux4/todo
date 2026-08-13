# aux4/todo

Todo list manager for aux4. Create and manage multiple todo lists stored in `.todo.json` files using Jira-style prefixed task IDs (`SPR-001`, `SEO-002`). Each item has a status (`open`, `doing`, `done`) and supports an assignee, a long description, subtasks, timestamped comments, and cross-file references to tasks in other todo files.

The read model is designed to stay small: `view` prints a slim one-line-per-item index (no description bodies, no comment dumps), `show` loads the full detail of a single item by ID, `comments` pages newest-first, and `archive` moves finished items out of the way so busy lists stay readable.

## Installation

```bash
aux4 aux4 pkger install aux4/todo
```

## Data Model

Each list has a `prefix` (2-10 uppercase letters, e.g. `SPR`, `SEO`) and an auto-incrementing `counter`. Task IDs are `PREFIX-NNN`. Item bodies live in the `tasks` map, keyed by ID for O(1) lookup. Two id arrays drive iteration:

- `order` — active top-level item IDs, in display order. This is the source of truth for `view` and `list`.
- `archived` — archived top-level item IDs. These are absent from `order` and hidden from `view` and `list` counts.

Subtasks live in the same `tasks` map with `type: "subtask"` and a `parent` reference; they are discovered by scanning for their parent and are not listed in `order` or `archived`. Cross-file references map a foreign prefix to an external todo file so a task ID from another file can be resolved.

```json
{
  "sprint-1": {
    "prefix": "SPR",
    "counter": 3,
    "order": ["SPR-001"],
    "archived": [],
    "references": {
      "SEO": "../seo/.todo.json#seo-tasks"
    },
    "tasks": {
      "SPR-001": {
        "text": "Import products",
        "completed": false,
        "status": "doing",
        "assignee": "Alex",
        "description": "Import the next 5 IKEA products",
        "comments": [
          {
            "author": "Mike",
            "message": "Focus on KALLAX cluster first",
            "date": "2026-05-20T11:57:26.000Z"
          }
        ]
      },
      "SPR-002": {
        "text": "Verify URLs",
        "type": "subtask",
        "parent": "SPR-001",
        "completed": false,
        "status": "open"
      }
    }
  }
}
```

By default todos are stored in `.todo.json` in the current directory. Use the `--file` flag on any command to target a different file path.

### Automatic migration

Older `.todo.json` files that predate the `order`/`archived` arrays (items carried a numeric `order` field instead) are upgraded transparently on the first command that touches the file. The `order` array is rebuilt from the legacy numeric field, any item marked `archived: true` is moved into the `archived` array, the redundant per-item `order` field is dropped, and the file is saved back in the new shape. No manual migration is required.

### Task status

Every task and subtask has a `status` field with three values:

- `open` — not started (the default for new items)
- `doing` — in progress
- `done` — completed

`status` and the `completed` flag are always kept in sync: `done` corresponds to `completed: true`, while `open` and `doing` correspond to `completed: false`. Use `aux4 todo move` to change status, or `aux4 todo complete` as a shortcut for the `open` ⇄ `done` transition.

**Backward compatibility:** items written before the `status` field existed keep working unchanged. When an item has no `status`, it is derived from `completed` (`true` → `done`, `false` → `open`). No file migration is required — only items you move gain a stored `status` field.

## Commands

| Command | Description |
|---------|-------------|
| `list` | List all todo lists with progress and archived tally |
| `view` | Slim one-line index of a todo list (with `--status` filter) |
| `show` | Full detail of a single item by ID (description + recent comments) |
| `new` | Create a new todo list with a prefix |
| `add` | Add an item to an existing todo list |
| `remove` | Remove an item from a todo list |
| `complete` | Mark a todo item as complete or incomplete |
| `move` | Move a todo item to a status (open, doing, done) |
| `delete` | Delete an entire todo list |
| `assign` | Assign a todo item to someone |
| `describe` | Set or update the description of a todo item |
| `subtask` | Add a subtask to a todo item |
| `subtasks` | View subtasks of a todo item |
| `comment` | Add a comment to a todo item |
| `comments` | View comments on a todo item (newest first, paginated) |
| `archive add` | Archive an item (hidden from view and list counts) |
| `archive remove` | Restore an archived item to the active list |
| `archive list` | List archived items of a todo list |
| `reference` | Add a cross-file reference for foreign prefixes |

### List all todo lists

```bash
aux4 todo list
```

### View a specific todo list

`view` prints a slim, one-line-per-item index: ID, status checkbox, text, assignee, subtask progress, comment count, and a `+desc` marker when the item has a description. It never prints the description body or comments — keeping the output small even for busy lists. Use `show` to read a single item in full.

By default `view` shows only `open` and `doing` items (completed work is hidden). Use `--status` to change this: `all` shows everything, or pass a single value (`open`, `doing`, `done`) to filter to exactly that status. Archived items are never shown.

```bash
aux4 todo view "sprint-1"
aux4 todo view "sprint-1" --status all
aux4 todo view "sprint-1" --status done
```

```text
## sprint-1 [SPR]
  SPR-001: [~] Import products @Alex (2 subtasks: 1/2) (1 comment) +desc
  SPR-004: [ ] Write release notes
```

### Show a single item

`show` is the by-ID read primitive: it loads one item's full detail without dumping the whole list. It prints the header (id, status, assignee, text), a subtask summary, the description, and the most recent comments (newest first). The description is truncated to about the first 500 characters unless you pass `--full`, and the last 3 comments are shown unless you pass `--comments N`.

```bash
aux4 todo show "sprint-1" --id SPR-001
aux4 todo show "sprint-1" --id SPR-001 --full true --comments 10
```

```text
## sprint-1 > SPR-001: Import products
Status: doing [~]   Assignee: @Alex   Subtasks: 1/2

Description:
Import the next 5 IKEA products with verified URLs …(truncated — --full for all)

Comments (showing last 3 of 5):
  [5/22/2026, 9:10:00 AM] Alex: All five verified
  [5/21/2026, 4:30:00 PM] Sophia: Two more to go
  [5/20/2026, 11:57:26 AM] Mike: Focus on KALLAX cluster first
```

### Create a new todo list

A prefix (2-10 uppercase letters) is required. An initial item is optional.

```bash
aux4 todo new "sprint-1" --prefix SPR --item "Import products"
```

### Add an item to an existing list

Returns the generated task ID. Optionally set an assignee and description.

```bash
aux4 todo add "sprint-1" --item "SEO audit" --assignee "Sophia"
```

### Remove an item

```bash
aux4 todo remove "sprint-1" --id SPR-001
```

### Mark an item complete or incomplete

Without `--status`, the command toggles the item. Pass `--status true` or `--status false` to set it explicitly. `complete` is a shortcut for `move`: `--status true` moves the item to `done`, `--status false` moves it to `open`.

```bash
aux4 todo complete "sprint-1" --id SPR-001
aux4 todo complete "sprint-1" --id SPR-001 --status true
```

### Move an item to a status

Move a task or subtask to `open`, `doing`, or `done`. Moving to `done` sets `completed` to `true`; moving to `open` or `doing` sets it to `false`.

```bash
aux4 todo move "sprint-1" --id SPR-001 --status doing
aux4 todo move "sprint-1" --id SPR-001 --status done
```

### Delete an entire list

```bash
aux4 todo delete "sprint-1"
```

### Assign an item

Assign to someone, or pass an empty `--assignee` to unassign.

```bash
aux4 todo assign "sprint-1" --id SPR-001 --assignee "Alex"
```

### Describe an item

Set or update the long description. It is not shown in the slim `view` output (only a `+desc` marker appears there) — read it with `aux4 todo show`.

```bash
aux4 todo describe "sprint-1" --id SPR-001 --description "Import the next 5 IKEA products with verified URLs"
```

### Subtasks

Add a subtask to an item, then view all subtasks of that item. Subtasks of subtasks are not allowed.

```bash
aux4 todo subtask "sprint-1" --id SPR-001 --item "Verify KALLAX URL" --assignee "Alex"
aux4 todo subtasks "sprint-1" --id SPR-001
```

### Comments

Add a timestamped comment to an item, then read comments newest-first. `comments` shows the last 3 by default and reports the window with a `showing X–Y of Z` header. Use `--limit` and `--offset` to page through older comments.

```bash
aux4 todo comment "sprint-1" --id SPR-001 --author "Mike" --message "Focus on KALLAX cluster first"
aux4 todo comments "sprint-1" --id SPR-001
aux4 todo comments "sprint-1" --id SPR-001 --limit 5 --offset 3
```

```text
## sprint-1 > SPR-001: Import products — showing 1–3 of 5
  [5/22/2026, 9:10:00 AM] Alex: All five verified
  [5/21/2026, 4:30:00 PM] Sophia: Two more to go
  [5/20/2026, 11:57:26 AM] Mike: Focus on KALLAX cluster first
```

### Archive

Archiving moves a finished top-level item out of the active list so busy lists stay readable. Archived items disappear from `view` and no longer count toward `list` progress (which instead reports an archived tally, e.g. `(8/17, 3 archived)`). Archiving is fully reversible — the item keeps all its data.

```bash
aux4 todo archive add "sprint-1" --id SPR-002       # hide a finished item
aux4 todo archive list "sprint-1"                    # see what's archived
aux4 todo archive remove "sprint-1" --id SPR-002     # bring it back
```

```text
## sprint-1 [SPR] (archived)
  SPR-002: [x] O̶l̶d̶ ̶m̶i̶g̶r̶a̶t̶i̶o̶n̶ ̶t̶a̶s̶k̶
```

Subtasks cannot be archived directly — archive their parent item instead.

### Cross-file references

Map a foreign prefix to a task list in another todo file. Once a reference exists, task IDs using that prefix (e.g. `SEO-001`) resolve into the referenced file — useful for adding subtasks to, or viewing tasks from, another list.

```bash
aux4 todo reference "sprint-1" --prefix SEO --target "../seo/.todo.json#seo-tasks"
```

## Storage

By default, todos are stored in `.todo.json` in the current directory. Use the `--file` flag on any command to specify a different file path. Writes are atomic (written to a temp file then renamed) and guarded by a lock file so concurrent processes do not corrupt the list.
