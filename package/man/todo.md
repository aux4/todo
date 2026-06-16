# todo

Manage todo lists with Jira-style prefixed task IDs, assignees, descriptions, subtasks, comments, and cross-file references.

## Usage

```bash
aux4 todo <command>
```

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

## Data Model

Each list has a prefix (e.g. `SPR`, `SEO`) and a counter. Task IDs are `PREFIX-NNN` (auto-incrementing). Subtasks live in the same list with `type: "subtask"` and a `parent` reference. Cross-file references map foreign prefixes to external todo files.

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
        "assignee": "Alex"
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
