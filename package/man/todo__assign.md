# todo assign

Assign a todo item to someone, or unassign by omitting the assignee.

## Usage

```bash
aux4 todo assign <name> --id <PREFIX-NNN> [--assignee <name>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--assignee` | Assignee name (empty to unassign) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo assign "sprint-1" --id SPR-001 --assignee "Alex"
```

```text
SPR-001 in 'sprint-1' assigned to Alex.
```
