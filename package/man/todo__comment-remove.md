# todo comment-remove

Remove a comment from a todo item by its 0-based array index (the position in the item's stored `comments` array, oldest first).

When an `--author` is provided, the comment is only removed if it belongs to that author — an own-comment gate enforced server-side. Attempting to delete someone else's comment fails with `You can only delete your own comments.` and the comment is left untouched. When `--author` is omitted, any comment at the given index is removed.

An out-of-range index is a no-op: the command succeeds and the comment list is returned unchanged.

## Usage

```bash
aux4 todo comment-remove <name> --id <PREFIX-NNN> --index <n> [--author <name>] [--file <path>] [--format <text|json>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Item id, e.g. SPR-001 (required) | |
| `--index` | Comment array index to remove (0-based) | |
| `--author` | If set, only remove the comment when it belongs to this author | |
| `--file` | Todo file path | `.todo.json` |
| `--format` | Output format: `text` (default) or `json` | `text` |

## Example

```bash
aux4 todo comment-remove "sprint-1" --id SPR-001 --index 0
```

```text
Comment removed from SPR-001 in 'sprint-1'.
```

With the own-comment gate, deleting another author's comment is refused:

```bash
aux4 todo comment-remove "sprint-1" --id SPR-001 --index 0 --author Bob
```

```text
You can only delete your own comments.
```

With `--format json`, the remaining comments are returned as JSON (used by the aux4/platform UI):

```bash
aux4 todo comment-remove "sprint-1" --id SPR-001 --index 0 --format json
```

```json
{
  "comments": []
}
```
