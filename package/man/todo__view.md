# todo view

View a specific todo list showing top-level items with their prefixed IDs, assignees, descriptions, subtask counts, and comment counts.

## Usage

```bash
aux4 todo view <name> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo view "sprint-1"
```

```text
## sprint-1 [SPR]
  SPR-001: [ ] Import products @Alex (2 subtasks: 1/2) (1 comment)
              Import next batch of IKEA products
  SPR-002: [x] SEO audit @Sophia
```
