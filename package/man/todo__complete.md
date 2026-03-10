# todo complete

Mark a todo item as complete or incomplete.

## Usage

```bash
aux4 todo complete <name> --index <number> [--status <true|false>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--index` | Item index, 0-based (required) | |
| `--status` | Completion status | `true` |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo complete "Work" --index 0
```

```
Item 0 in 'Work' marked as completed.
```
