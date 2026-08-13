# todo show

Show full detail for a single todo item — the by-ID read primitive. Prints a header (id, status, assignee, text), a subtask summary, the description, and the most recent comments (newest first). This is what you use to load one item's full context instead of dumping an entire list with `view`.

By default the description is truncated to roughly the first 500 characters (with a `…(truncated — --full for all)` marker) and the last 3 comments are shown. Use `--full` for the entire description and `--comments N` to change how many comments appear.

## Usage

```bash
aux4 todo show <name> --id <PREFIX-NNN> [--full <true|false>] [--comments <n>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--full` | Show the entire description instead of a chunk | `false` |
| `--comments` | Number of recent comments to show | `3` |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo show "sprint-1" --id SPR-001
```

```text
## sprint-1 > SPR-001: Import products
Status: doing [~]   Assignee: @Alex   Subtasks: 1/2

Description:
Import the next 5 IKEA products with verified URLs. Start with the KALLAX cluster …(truncated — --full for all)

Comments (showing last 3 of 5):
  [5/22/2026, 9:10:00 AM] Alex: All five verified
  [5/21/2026, 4:30:00 PM] Sophia: Two more to go
  [5/20/2026, 11:57:26 AM] Mike: Focus on KALLAX cluster first
```

Read the whole description:

```bash
aux4 todo show "sprint-1" --id SPR-001 --full true
```
