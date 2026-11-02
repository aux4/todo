# aux4/todo 1.5.0

Semantic item kinds and goal linking, so a stream can carry goals alongside its tasks and roll up progress against them. The item-kind and goal-linking additions are strictly additive — all pre-existing tests pass unchanged, default-task output is byte-identical, and the on-disk format only grows new optional fields. `remove` of a parent with subtasks is a **breaking change** (see below).

## New

- **`type` is now a semantic item kind** (`task` by default, or any free lowercase string such as `goal`, `bug`, `feature`) instead of the old subtask marker. `--type <kind>` is accepted on `new`, `add`, and `subtask` (`--type goal` is rejected on `subtask` — a subtask can never be a goal). `view` and `show` display the kind with a `[kind]` tag whenever it isn't the default `task` — a plain task's output is unchanged.
- **Subtask-ness is now derived from `parent` presence, not from `type`.** The legacy `type: "subtask"` marker is still written by default when `subtask` is called without `--type` (so the on-disk shape for an untyped subtask is unchanged), but a subtask can now carry any kind (e.g. `subtask ... --type bug`) and is still correctly counted and nested under its parent. The one-level nesting rule (no subtask of a subtask) is unchanged.
- **`todo view <name> --type <kind>`** — filter a list's top-level items to a single kind.
- **Goal linking** — a top-level task can link to a goal item via a new `goal: "<id>"` field: `todo link <name> --id <id> --goal <goalId>` / `todo unlink <name> --id <id>`, or `todo add <name> --item <text> --goal <goalId>` to link at creation. Linking is cross-list: the goal can live in any stream in the same file (resolved by id). Subtasks cannot be linked directly — link their parent.
- **`todo view <name> --goal <id>`** — filter a list's top-level items to those linked to a goal.
- **`todo goals [--file <file>]`** — one line per non-archived goal item (any list in the file), with linked-task progress rolled up (done/total, counting each linked task's own subtasks too) and a flag when every linked task is done. An archived goal is hidden from this listing; an archived linked task still counts toward its (non-archived) goal's rollup. Goal completion itself stays manual — `goals` only reports the rollup, it never auto-completes the goal.
- **Removing a goal unlinks its tasks.** `todo remove <name> --id <goalId>` on an item whose kind is `goal` clears the `goal` field on every top-level task (any list in the file) that pointed at it, and reports how many tasks were unlinked.

## Changed — BREAKING

- **`todo remove` on a parent with subtasks now fails unless `--cascade true` is passed.** Earlier versions silently removed a parent's subtasks along with it. `remove` now errors, naming how many subtasks the item has (subtasks are searched across every list in the file, not just the one named), and requires `--cascade true` to proceed with removing the item and all of its subtasks — matching the previous (now opt-in) behavior.

## Migration

- A legacy on-disk `type: "subtask"` marker (with `parent` set) is read as "no kind — task" in memory immediately, since subtask-ness now comes from `parent`. Like the v3 order/archived migration, this is only ever persisted the next time that list is written; a pure read never rewrites the file.
- Any script or integration that calls `todo remove` on an item that may have subtasks must add `--cascade true` to keep removing them; otherwise the call now fails with an error instead of silently cascading.

# aux4/todo 1.4.0

Native archive offload and schema-aware merge, so a heavily used ledger can be kept small without losing history and split ledgers can be rejoined. Strictly additive — all existing tests pass unchanged, the on-disk format is unchanged, writes stay atomic and 2-space pretty-printed.

## New

- **`todo archive offload [<name>] [--into <archiveFile>]`** — move a list's archived items (and their subtasks) out of the live file into a separate archive file, shrinking the live ledger. The archive file is a normal todo file, so offloaded history stays readable with `archive list`/`show` against it. With no `--into` the archive path is derived from the live file (`.todo.json` → `.todo.archive.json`); with `--into` items are merged into an existing archive (same-schema merge, archive wins on id conflict) so repeated offloads are additive. Omit `<name>` to offload every list in the file. `--format json` returns `{ moved, streams, archiveFile, conflicts }`.
- **`todo merge <source> [<source> ...] [--into <file>]`** — combine multiple todo files, reconciled per stream: `tasks`/`order`/`archived` unioned, `counter = max`, `references` unioned. Files merge left to right; the first is the base and wins on task-id conflict (idempotent). Restores an offloaded archive, consolidates split ledgers, or recovers from a bad split. Writes in place with `--into`, otherwise prints the merged JSON to stdout. Wraps todo-schema-aware logic that generic `aux4 json merge` does not provide.

# aux4/todo 1.3.0

Two editing primitives so a platform app (app-todo) can delegate 100% of its operations to the CLI and never touch the `.todo.json` itself. Strictly additive — all existing tests pass unchanged, reads never rewrite the file, and legacy files still upgrade only on write.

## New

- **`todo rename <name> --id <id> --text <text>`** — rename a task or subtask (change its `text`). Symmetric with `describe`: `rename` sets the title, `describe` sets the long description. Validates non-empty text; preserves status, assignee, description, comments, subtasks, and ordering. `--format json` returns `{ id, text }`.
- **`todo rename-list <name> --newName <newName>`** — rename a list (change its key) while keeping `prefix`, `counter`, `tasks`, `order`, `archived`, and `references` intact and the list in its original position. Errors if the current list is missing or the new name already exists. `--format json` returns `{ oldName, newName }`.

# aux4/todo 1.2.0

Completes the v1.1 read-model enhancement: first-class task status, single-item detail, author-gated comment removal, paginated comments, machine-readable JSON output for the aux4/platform UI, and a working archive. Several commands (`move`, `show`, `archive add|remove|list`) were declared in `.aux4` and documented but not yet implemented — this release implements them.

## New

- **First-class status + `todo move <name> --id <id> --status <open|doing|done>`** — every task carries a `status` field (`open`/`doing`/`done`). `completed` is kept in sync (`done` ⇔ `completed`). Items written before `status` existed derive it from `completed` and are not rewritten unless touched. `view` renders status as `[ ]` (open), `[~]` (doing), `[x]` (done, struck through).
- **`todo show <name> --id <id>`** — full detail for a single item: header, status/assignee/subtask meta line, description (truncated by default, `--full` for all), and recent comments newest-first (`--comments N`, default 3).
- **`todo comment-remove <name> --id <id> --index <n> [--author <name>]`** — remove a comment by 0-based index. Author-gated: with `--author`, deleting another author's comment is refused with `You can only delete your own comments.`
- **`todo archive add|remove|list`** — archive items out of the active list. Archived items are hidden from `view` and excluded from `list` counts (which show an archived tally, e.g. `(0/2, 1 archived)`). `archive remove` restores an item; `archive list` shows archived items. Subtasks cannot be archived directly.

## Changed

- **`comments` is newest-first and paginated** — `## <name> > <id>: <text> — showing X–Y of Z` header, last 3 by default, `--limit` and `--offset` to page through older comments.
- **`view` is a slim one-line index** — ID, status marker, text, `@assignee`, `+desc` marker when a description exists, subtask progress, and comment count. No description body inline. `--status` filter: default shows `open`+`doing` (hides `done`), `all` shows everything, or a single status filters to exactly that.
- **`--format json`** on `list`, `view`, `show`, `comments`, and `subtasks` prints machine-readable JSON for the aux4/platform UI.

## Storage

- Per-list shape is `{ prefix, counter, tasks, order, archived, references? }`. `order` holds active top-level IDs in display order; `archived` holds archived top-level IDs. The per-item numeric `order` field and per-item `archived` flag are gone.
- **Automatic migration on write:** old-shape files (v0 array, v1 flat object, or v2 numeric-order/archived-flag) upgrade transparently on the first command that writes to the file — `order` is rebuilt, legacy archived items move into the `archived` array, redundant per-item fields are dropped. Read-only commands apply the same upgrade in memory but never rewrite the file, so reads cannot clobber a concurrent write.
