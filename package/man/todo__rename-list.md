# todo rename-list

Rename a todo list — change its name (the top-level key in the `.todo.json` file) while keeping everything else intact: `prefix`, `counter`, all `tasks`, the `order` and `archived` arrays, and any cross-file `references`. Task IDs are unaffected (they derive from the prefix, not the list name).

The list keeps its position among other lists in the file, so `list` output ordering is stable. Renaming fails if the current list does not exist, or if a list with the new name already exists.

## Usage

```bash
aux4 todo rename-list <name> --newName <new name> [--file <path>] [--format <text|json>]
```

--name     Current todo list name (required)
--newName  New todo list name; must not already exist (required)
--file     Todo file path (default: `.todo.json`)
--format   Output format: `text` (default) or `json`

## Example

```bash
aux4 todo rename-list "sprint" --newName "sprint-2"
```

```text
Todo 'sprint' renamed to 'sprint-2'.
```

With `--format json`, the old and new names are returned (used by the aux4/platform UI):

```bash
aux4 todo rename-list "sprint" --newName "sprint-2" --format json
```

```json
{
  "oldName": "sprint",
  "newName": "sprint-2"
}
```

Renaming to an existing name is rejected:

```bash
aux4 todo rename-list "sprint" --newName "backlog"
```

```text
Todo 'backlog' already exists.
```
