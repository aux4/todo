# todo subtask

Add a subtask to a todo item. Subtasks are stored in the same list with a parent reference. Subtasks of subtasks are not allowed.

Subtask-ness comes from the `parent` reference, not from `type` — so a subtask can carry any kind. Without `--type`, a subtask keeps the legacy `subtask` marker on disk (unchanged on-disk shape for the common case); passing `--type` gives it a real semantic kind (e.g. `bug`) while it's still correctly nested and counted under its parent.

## Usage

```bash
aux4 todo subtask <name> --id <PREFIX-NNN> --item <text> [--assignee <name>] [--description <text>] [--type <kind>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Parent task id, e.g. SPR-001 (required) | |
| `--item` | Subtask text | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--type` | Item kind, e.g. `bug`, `feature` | `subtask` (legacy marker) |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo subtask "sprint-1" --id SPR-001 --item "Verify KALLAX URL" --assignee "Alex"
```

```text
SPR-003 added as subtask of SPR-001 in 'sprint-1'.
```
