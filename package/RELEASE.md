# aux4/todo 1.1.0

Agent-efficiency read model. This release cuts the context cost of reading a todo list: on a busy list, `view` now prints an ~80% smaller index (measured: 100 KB → 20 KB / 733 → 99 lines on a 101-item list) by dropping description bodies and comment dumps.

## New

- **`todo show <name> --id <id>`** — full detail for a single item: header (id, status, assignee, text), subtask summary, description, and recent comments (newest first). `--full` shows the whole description (otherwise truncated to ~500 chars); `--comments N` sets how many comments to show (default 3). This is the by-ID read primitive for loading one item instead of a whole list.
- **`todo archive add|remove|list`** — archive finished items out of the active list. Archived items are hidden from `view` and excluded from `list` progress counts (which now show an archived tally, e.g. `(8/17, 3 archived)`). Fully reversible.

## Changed

- **`view` is now a slim one-line-per-item index** — ID, status checkbox, text, assignee, subtask progress, comment count, and a `+desc` marker when a description exists. The description body and comments are no longer printed inline. New `--status` filter: default shows `open` + `doing` (hides `done`); `all` shows everything; a single value (`open`, `doing`, `done`) filters to exactly that status. Archived items are never shown.
- **`comments` is now newest-first and paginated** — shows the last 3 by default with a `showing X–Y of Z` header; `--limit` and `--offset` page through older comments.
- **`list`** reports an archived tally alongside progress when a list has archived items.

## Storage

- Per-list shape is now `{ prefix, counter, tasks, order, archived, references? }`. `order` holds active top-level IDs in display order; `archived` holds archived top-level IDs. The per-item numeric `order` field is gone.
- **Automatic migration:** old-shape files upgrade themselves transparently on the first command that **writes** to the file — `order` is rebuilt from the legacy numeric field, legacy `archived: true` items move into the `archived` array, the redundant numeric field is dropped, and the file is saved back. Read-only commands apply the same upgrade in memory for correct output but never rewrite the file, so reads cannot clobber a concurrent write. No manual migration required.
