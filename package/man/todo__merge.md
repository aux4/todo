# todo merge

Combine one or more todo files into a single result, reconciling them with awareness of the todo schema. Unlike a generic JSON merge, `todo merge` understands each list's structure and merges it correctly, per stream (list name) and then per task id.

For each list that appears in more than one file it:

- **unions `tasks`** by id — every task from every file is kept;
- **unions `order`** preserving sequence — the base file's order first, then any new ids from later files appended in their order;
- **unions `archived`** the same way;
- takes **`counter = max`** across the files so future ids never collide;
- **unions `references`**, with the base winning on a key conflict;
- keeps the base list's **`prefix`**.

The files are merged left to right: the first file is the **base**, and on any id conflict (the same task id present in two files) the base's version is kept and the later one is dropped. This makes merging idempotent and safe — re-merging never overwrites an existing record. The number of dropped conflicts is reported.

Common uses:

- **Restore an offloaded archive** (see `todo archive offload`) back into a live ledger: `aux4 todo merge .todo.json .todo.archive.json --into .todo.json`.
- **Consolidate ledgers** split across machines or branches into one.
- **Recover** from a bad split.

With `--into <file>` the merged result is written back to that file in place (atomic write, 2-space pretty-print). Without `--into`, the merged JSON is printed to stdout so it can be inspected or redirected. `aux4 json merge` exists but is a generic array-by-id merge and is **not** todo-schema-aware; use `todo merge` for todo files.

## Usage

```bash
aux4 todo merge <source> [<source> ...] [--into <file>] [--format <text|json>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `source` | Source todo file(s) to merge, left to right; the first is the base and wins on id conflict (required, repeatable) | |
| `--into` | Write the merged result to this file in place; omit to print the merged JSON to stdout | *(stdout)* |
| `--format` | Output format: `text` (default) or `json` | `text` |

## Example

Merge two ledgers into a new file:

```bash
aux4 todo merge team-a.json team-b.json --into combined.json
```

```text
Merged 2 file(s) into combined.json.
```

Restore an offloaded archive back into the live file:

```bash
aux4 todo merge .todo.json .todo.archive.json --into .todo.json
```

Inspect a merge without writing it (prints the merged JSON to stdout):

```bash
aux4 todo merge base.json patch.json
```

When id conflicts are found on an `--into` merge, the count is reported:

```text
Merged 2 file(s) into combined.json (1 id conflict(s) kept from base).
```

`--format json` on an `--into` merge prints `{ "into": "...", "sources": [...], "streams": [...], "conflicts": [...] }`.
