# todo comments

View comments on a todo item, newest first, with pagination. By default the last 3 comments are shown. Use `--limit` and `--offset` to page through older comments. The header reports the window and total count: `showing X–Y of Z`.

## Usage

```bash
aux4 todo comments <name> --id <PREFIX-NNN> [--limit <n>] [--offset <n>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--limit` | Number of comments to show | `3` |
| `--offset` | Number of newest comments to skip | `0` |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo comments "sprint-1" --id SPR-001
```

```text
## sprint-1 > SPR-001: Import products — showing 1–3 of 5
  [5/22/2026, 9:10:00 AM] Alex: All five verified
  [5/21/2026, 4:30:00 PM] Sophia: Two more to go
  [5/20/2026, 11:57:26 AM] Mike: Focus on KALLAX cluster first
```

Page to the older comments:

```bash
aux4 todo comments "sprint-1" --id SPR-001 --limit 2 --offset 3
```

```text
## sprint-1 > SPR-001: Import products — showing 4–5 of 5
  [5/20/2026, 10:05:00 AM] Alex: Starting the import
  [5/19/2026, 2:00:00 PM] Mike: Created the ticket
```
