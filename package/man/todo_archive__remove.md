# todo archive remove

Restore an archived item back to the active todo list. The item is moved out of the list's `archived` set and appended to the active `order` list, so it appears in `aux4 todo view` and counts toward `aux4 todo list` progress again.

## Usage

```bash
aux4 todo archive remove <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo archive remove "sprint-1" --id SPR-002
```

```text
SPR-002 unarchived in 'sprint-1'.
```
