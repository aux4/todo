# todo comments

View all comments on a todo item with author and timestamp.

## Usage

```bash
aux4 todo comments <name> --id <PREFIX-NNN> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo comments "sprint-1" --id SPR-001
```

```text
## sprint-1 > SPR-001: Import products
  [5/20/2026, 11:57:26 AM] Mike: Focus on KALLAX cluster first
  [5/20/2026, 12:05:00 PM] Alex: Working on it, 3 of 5 verified
```
