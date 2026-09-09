# todo rename

Rename a todo item — change its `text` (the item's title). Works on both top-level tasks and subtasks. This is the by-ID edit primitive symmetric with `describe` (which sets the long description): `rename` sets the short title.

The new text must be non-empty; an empty or whitespace-only value is rejected. Only the `text` field changes — status, `completed`, assignee, description, comments, subtasks, and ordering are all preserved.

## Usage

```bash
aux4 todo rename <name> --id <PREFIX-NNN> --text <new text> [--file <path>] [--format <text|json>]
```

--name    Todo list name (required)
--id      Item id, e.g. SPR-001 (required)
--text    New item text; must be non-empty (required)
--file    Todo file path (default: `.todo.json`)
--format  Output format: `text` (default) or `json`

## Example

```bash
aux4 todo rename "sprint-1" --id SPR-001 --text "Import the next 5 products"
```

```text
SPR-001 in 'sprint-1' renamed.
```

With `--format json`, the updated id and text are returned (used by the aux4/platform UI):

```bash
aux4 todo rename "sprint-1" --id SPR-001 --text "Import the next 5 products" --format json
```

```json
{
  "id": "SPR-001",
  "text": "Import the next 5 products"
}
```

An empty title is rejected:

```bash
aux4 todo rename "sprint-1" --id SPR-001 --text ""
```

```text
Item text cannot be empty.
```
