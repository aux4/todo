# todo view

View a specific todo list with all items.

## Usage

```bash
aux4 todo view <name> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo view "Work"
```

```
## Work
  0: [x] Review PR
  1: [ ] Deploy code
```
