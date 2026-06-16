# todo list

List all todo lists with their prefix and progress. Subtask items are excluded from counts.

## Usage

```bash
aux4 todo list [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo list
```

```text
Todo Lists:
  [SPR] sprint-1 (1/3)
  [BKL] backlog (0/5)
```
