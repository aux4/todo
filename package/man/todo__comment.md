# todo comment

Add a timestamped comment to a todo item.

## Usage

```bash
aux4 todo comment <name> --id <PREFIX-NNN> --author <name> --message <text> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--author` | Comment author name | |
| `--message` | Comment text | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo comment "sprint-1" --id SPR-001 --author "Mike" --message "Focus on KALLAX cluster first"
```

```text
Comment added to SPR-001 in 'sprint-1'.
```
