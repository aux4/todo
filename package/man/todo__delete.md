# todo delete

Delete an entire todo list including all its items and subtasks.

## Usage

```bash
aux4 todo delete <name> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo delete "sprint-1"
```

```text
Todo 'sprint-1' removed.
```
