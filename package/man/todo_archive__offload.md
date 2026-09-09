# todo archive offload

Move archived items out of the live todo file into a separate archive file, shrinking the live ledger so it parses faster, merges more cleanly in git, and has a smaller blast radius if it is ever read in bulk. Only items already in a list's `archived` set are moved; active items are never touched.

The destination is a normal todo file with the same schema, so offloaded history stays fully readable on demand — `aux4 todo archive list <name> --file <archive>` lists the offloaded items and `aux4 todo show <name> --id <id> --file <archive>` shows a single one with its description and comment history intact.

Offloading is additive and safe to repeat. Items are merged into the destination with the same schema-aware reconciliation as `aux4 todo merge` (union per stream, the destination winning on any id conflict), so re-running it never clobbers records already offloaded.

- **Own-file mode (default):** with no `--into`, the archive file is derived from the live file by inserting an `.archive` segment — `.todo.json` → `.todo.archive.json`, `sprint.json` → `sprint.archive.json`.
- **`--into <file>` mode:** merges the newly offloaded items into an existing archive file you name, letting many live files share one long-term archive.
- **All lists or one:** pass a list name to offload just that list, or omit it to offload the archived items of every list in the file.

Subtasks of an offloaded item are carried into the archive with it. Writes are atomic (temp file + rename) and pretty-printed with 2-space indent, matching the rest of the tool.

## Usage

```bash
aux4 todo archive offload [<name>] [--file <path>] [--into <archiveFile>] [--format <text|json>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name to offload; omit to offload every list in the file | *(all lists)* |
| `--file` | Live todo file path | `.todo.json` |
| `--into` | Destination archive file to merge into | *(live file with an `.archive.json` suffix)* |
| `--format` | Output format: `text` (default) or `json` | `text` |

## Example

Offload one list's archived items to the default archive file:

```bash
aux4 todo archive offload sprint-1 --file .todo.json
```

```text
Offloaded 2 archived item(s) from sprint-1 to .todo.archive.json.
```

Read the offloaded history back on demand:

```bash
aux4 todo archive list sprint-1 --file .todo.archive.json
```

```text
## sprint-1 [SPR] (archived)
  SPR-002: [x] O̶l̶d̶ ̶m̶i̶g̶r̶a̶t̶i̶o̶n̶ ̶t̶a̶s̶k̶
  SPR-007: [x] D̶e̶f̶e̶r̶r̶e̶d̶ ̶c̶l̶e̶a̶n̶u̶p̶
```

Offload the archived items of every list into one shared archive:

```bash
aux4 todo archive offload --file .todo.json --into ~/todo-archive.json
```

To restore offloaded items back into the live file, merge the archive back in with `aux4 todo merge` (see its man page).

`--format json` prints `{ "moved": <n>, "streams": [...], "archiveFile": "...", "conflicts": [...] }`.
