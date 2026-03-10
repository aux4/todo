# todo new

Create a new todo list with an optional initial item.

## Usage

```bash
aux4 todo new <name> [--item <text>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--item` | Initial todo item (optional) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo new "Work" --item "Review PR"
```

```
Todo 'Work' created.
```
