# todo add

Add a new item to an existing todo list. Returns the generated task ID.

## Usage

```bash
aux4 todo add <name> --item <text> [--assignee <name>] [--description <text>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--item` | Item text (required) | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo add "sprint-1" --item "SEO audit" --assignee "Sophia"
```

```text
SPR-002 added to 'sprint-1'.
```
