# todo remove

Remove an item from a todo list.

If the item has subtasks — including subtasks that live in a different list within the same file — `remove` fails with an error naming how many subtasks it has, instead of silently deleting them. Pass `--cascade true` to remove the item and every one of its subtasks in one call.

If the removed item's kind is `goal`, every top-level task (in any list in the file) whose `goal` field points at it has that field cleared, and the command reports how many tasks were unlinked.

## Usage

```bash
aux4 todo remove <name> --id <PREFIX-NNN> [--cascade <true|false>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--cascade` | Remove subtasks along with the item (required if the item has subtasks) | `false` |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo remove "sprint-1" --id SPR-002
```

```text
SPR-002 removed from 'sprint-1'.
```

Removing a parent with subtasks, without `--cascade`:

```bash
aux4 todo remove "sprint-1" --id SPR-001
```

```text
Item 'SPR-001' has 2 subtasks. Use --cascade true to remove it and all its subtasks.
```

Removing it with `--cascade true`:

```bash
aux4 todo remove "sprint-1" --id SPR-001 --cascade true
```

```text
SPR-001 removed from 'sprint-1'. 2 subtasks removed.
```

Removing a goal unlinks every task pointing at it:

```bash
aux4 todo remove "sprint-1" --id SPR-000
```

```text
SPR-000 removed from 'sprint-1'. 3 tasks unlinked.
```
