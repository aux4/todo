# todo link

Link a top-level task to a goal item. The goal must already exist and must be an item whose kind is `goal` (created with `aux4 todo new`/`add --type goal` or `aux4 todo describe`'d into one). The goal can be in any list in the same file — it's resolved purely by id, so this works across streams. `aux4 todo goals` rolls up every task linked to a goal, wherever it lives.

A subtask cannot be linked directly; link its parent instead. An item cannot be linked to itself.

## Usage

```bash
aux4 todo link <name> --id <PREFIX-NNN> --goal <goalId> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name the task belongs to (required) | |
| `--id` | Task id to link, e.g. SPR-002 (required) | |
| `--goal` | Id of the goal item to link to, e.g. SPR-000 (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo link "sprint-1" --id SPR-002 --goal SPR-000
```

```text
SPR-002 in 'sprint-1' linked to goal SPR-000.
```
