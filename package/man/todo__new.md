# todo new

Create a new todo list with an optional initial item.

## Usage

```bash
aux4 todo new <name> --prefix <PREFIX> [--item <text>] [--assignee <name>] [--description <text>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--prefix` | Task ID prefix, 2-10 uppercase letters (required) | |
| `--item` | Initial todo item (optional) | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo new "sprint-1" --prefix SPR --item "Import products" --assignee "Alex"
```

```text
Todo 'sprint-1' [SPR] created.
```
