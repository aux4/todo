# todo remove

Remove an item from a todo list.

## Usage

```bash
aux4 todo remove <name> --index <number> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--index` | Item index, 0-based (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo remove "Work" --index 1
```

```
Item 1 removed from 'Work'.
```
