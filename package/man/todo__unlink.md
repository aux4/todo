# todo unlink

Remove a task's link to its goal (if any). The task itself is untouched — only the `goal` field is cleared.

## Usage

```bash
aux4 todo unlink <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name the task belongs to (required) | |
| `--id` | Task id to unlink, e.g. SPR-002 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo unlink "sprint-1" --id SPR-002
```

```text
SPR-002 in 'sprint-1' unlinked from its goal.
```
