# todo subtasks

View all subtasks of a todo item.

## Usage

```bash
aux4 todo subtasks <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Parent task id, e.g. SPR-001 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo subtasks "sprint-1" --id SPR-001
```

```text
## sprint-1 > SPR-001: Import products
  SPR-003: [x] Verify KALLAX URL @Alex
  SPR-004: [ ] Verify PAX URL @Alex
  SPR-005: [ ] Run bulk import
```
