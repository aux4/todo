# todo new

Create a new todo list with an optional initial item.

## Usage

```bash
aux4 todo new <name> --prefix <PREFIX> [--item <text>] [--assignee <name>] [--description <text>] [--type <kind>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--prefix` | Task ID prefix, 2-10 uppercase letters (required) | |
| `--item` | Initial todo item (optional) | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--type` | Item kind for the initial item, e.g. `goal`, `bug`, `feature` | `task` |
| `--file` | Todo file path | `.todo.json` |

## Item kind

`--type` sets the item's semantic kind. It is free-form lowercase text; `task` is the implicit default when omitted, and `view`/`show` only display a `[kind]` tag when it isn't `task`. See `aux4 todo add` for the full kind/goal model.

## Example

```bash
aux4 todo new "sprint-1" --prefix SPR --item "Import products" --assignee "Alex"
```

```text
Todo 'sprint-1' [SPR] created.
```
