# todo view

View a slim, one-line-per-item index of a todo list. Each line shows the item's prefixed ID, status checkbox, text, assignee, subtask progress, comment count, and a `+desc` marker when a description exists. The description body and comments are intentionally omitted to keep the output small — use `aux4 todo show` to read a single item's full detail.

Archived items are never shown by `view`. Use `aux4 todo archive list` to see them.

## Usage

```bash
aux4 todo view <name> [--status <open|doing|done|all>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--status` | Filter by status: `open`, `doing`, `done`, or `all`. When unset, shows `open` + `doing` (hides `done`). | *(open + doing)* |
| `--file` | Todo file path | `.todo.json` |

## Status filter

- unset — shows `open` and `doing` items (hides completed work)
- `all` — shows `open`, `doing`, and `done`
- `open` / `doing` / `done` — shows only items with exactly that status

## Example

```bash
aux4 todo view "sprint-1"
```

```text
## sprint-1 [SPR]
  SPR-001: [~] Import products @Alex (2 subtasks: 1/2) (1 comment) +desc
  SPR-004: [ ] Write release notes
```

Show completed items as well:

```bash
aux4 todo view "sprint-1" --status all
```

```text
## sprint-1 [SPR]
  SPR-001: [~] Import products @Alex (2 subtasks: 1/2) (1 comment) +desc
  SPR-002: [x] S̶E̶O̶ ̶a̶u̶d̶i̶t̶ @Sophia
  SPR-004: [ ] Write release notes
```
