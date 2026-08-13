# todo archive add

Archive a top-level todo item. Archived items are moved out of the active `order` list and into the list's `archived` set. They no longer appear in `aux4 todo view` and are excluded from the progress counts shown by `aux4 todo list` (which instead reports an archived tally). The item and all its data are preserved — archiving is reversible with `aux4 todo archive remove`.

Subtasks cannot be archived directly; archive their parent item instead.

## Usage

```bash
aux4 todo archive add <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo archive add "sprint-1" --id SPR-002
```

```text
SPR-002 archived in 'sprint-1'.
```
