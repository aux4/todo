# todo complete

Mark a todo item as complete or incomplete. Toggles by default.

## Usage

```bash
aux4 todo complete <name> --id <PREFIX-NNN> [--status <true|false>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--status` | Explicit completion status | toggles |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo complete "sprint-1" --id SPR-001
```

```text
SPR-001 in 'sprint-1' marked as completed.
```
