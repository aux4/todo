# todo subtask

Add a subtask to a todo item. Subtasks are stored in the same list with a parent reference. Subtasks of subtasks are not allowed.

## Usage

```bash
aux4 todo subtask <name> --id <PREFIX-NNN> --item <text> [--assignee <name>] [--description <text>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Parent task id, e.g. SPR-001 (required) | |
| `--item` | Subtask text | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo subtask "sprint-1" --id SPR-001 --item "Verify KALLAX URL" --assignee "Alex"
```

```text
SPR-003 added as subtask of SPR-001 in 'sprint-1'.
```
