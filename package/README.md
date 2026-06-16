# aux4/todo

Todo list manager for aux4. Create and manage multiple todo lists stored in `.todo.json` files using Jira-style prefixed task IDs (`SPR-001`, `SEO-002`). Each item supports an assignee, a long description, subtasks, timestamped comments, and cross-file references to tasks in other todo files. List all todos with progress counters and view a specific list with strikethrough formatting for completed items.

## Installation

```bash
aux4 aux4 pkger install aux4/todo
```

## Data Model

Each list has a `prefix` (2-10 uppercase letters, e.g. `SPR`, `SEO`) and an auto-incrementing `counter`. Task IDs are `PREFIX-NNN`. Subtasks live in the same list with `type: "subtask"` and a `parent` reference. Cross-file references map a foreign prefix to an external todo file so a task ID from another file can be resolved.

```json
{
  "sprint-1": {
    "prefix": "SPR",
    "counter": 3,
    "references": {
      "SEO": "../seo/.todo.json#seo-tasks"
    },
    "tasks": {
      "SPR-001": {
        "text": "Import products",
        "completed": false,
        "order": 0,
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
        "order": 1
      }
    }
  }
}
```

By default todos are stored in `.todo.json` in the current directory. Use the `--file` flag on any command to target a different file path.

## Commands

| Command | Description |
|---------|-------------|
| `list` | List all todo lists with progress |
| `view` | View a specific todo list (top-level items) |
| `new` | Create a new todo list with a prefix |
| `add` | Add an item to an existing todo list |
| `remove` | Remove an item from a todo list |
| `complete` | Mark a todo item as complete or incomplete |
| `delete` | Delete an entire todo list |
| `assign` | Assign a todo item to someone |
| `describe` | Set or update the description of a todo item |
| `subtask` | Add a subtask to a todo item |
| `subtasks` | View subtasks of a todo item |
| `comment` | Add a comment to a todo item |
| `comments` | View comments on a todo item |
| `reference` | Add a cross-file reference for foreign prefixes |

### List all todo lists

```bash
aux4 todo list
```

### View a specific todo list

```bash
aux4 todo view "sprint-1"
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

Without `--status`, the command toggles the item. Pass `--status true` or `--status false` to set it explicitly.

```bash
aux4 todo complete "sprint-1" --id SPR-001
aux4 todo complete "sprint-1" --id SPR-001 --status true
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

Set or update the long description shown under the item.

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

Add a timestamped comment to an item, then view all comments with author and timestamp.

```bash
aux4 todo comment "sprint-1" --id SPR-001 --author "Mike" --message "Focus on KALLAX cluster first"
aux4 todo comments "sprint-1" --id SPR-001
```

### Cross-file references

Map a foreign prefix to a task list in another todo file. Once a reference exists, task IDs using that prefix (e.g. `SEO-001`) resolve into the referenced file — useful for adding subtasks to, or viewing tasks from, another list.

```bash
aux4 todo reference "sprint-1" --prefix SEO --target "../seo/.todo.json#seo-tasks"
```

## Storage

By default, todos are stored in `.todo.json` in the current directory. Use the `--file` flag on any command to specify a different file path. Writes are atomic (written to a temp file then renamed) and guarded by a lock file so concurrent processes do not corrupt the list.
