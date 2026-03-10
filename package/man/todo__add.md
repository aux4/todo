# todo add

Add a new item to an existing todo list.

## Usage

```bash
aux4 todo add <name> --item <text> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--item` | Item text (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo add "Work" --item "Schedule meeting"
```

```
Item added to 'Work'.
```
