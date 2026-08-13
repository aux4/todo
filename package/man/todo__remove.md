# todo remove

Remove an item from a todo list. If the item has subtasks, they are also removed.

## Usage

```bash
aux4 todo remove <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo remove "sprint-1" --id SPR-002
```

```text
SPR-002 removed from 'sprint-1'.
```
