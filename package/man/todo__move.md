# todo move

Move a todo item (task or subtask) to a status: `open`, `doing`, or `done`.

Every task carries a `status` field with three values:

- `open` — not started (the default for new items)
- `doing` — in progress
- `done` — completed

The `status` field and the `completed` flag are always kept in sync: moving an item to `done` sets `completed` to `true`; moving it to `open` or `doing` sets `completed` to `false`. `aux4 todo complete` is a shortcut for `move` — `complete` (or `complete --status true`) moves the item to `done`, and `complete --status false` moves it to `open`.

For backward compatibility, items written before the `status` field existed keep working: when an item has no `status`, it is derived from `completed` (`true` → `done`, `false` → `open`). No file migration is required, and only the moved item gains a `status` field.

## Usage

```bash
aux4 todo move <name> --id <PREFIX-NNN> --status <open|doing|done> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task or subtask id, e.g. SPR-001 (required) | |
| `--status` | Target status: `open`, `doing`, or `done` (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo move "sprint-1" --id SPR-001 --status doing
```

```text
SPR-001 in 'sprint-1' moved to doing.
```

Moving a subtask works the same way:

```bash
aux4 todo move "sprint-1" --id SPR-002 --status done
```

```text
SPR-002 in 'sprint-1' moved to done.
```

An unknown status is rejected:

```bash
aux4 todo move "sprint-1" --id SPR-001 --status blocked
```

```text
Invalid status 'blocked'. Must be one of: open, doing, done.
```
