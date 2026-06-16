# todo describe

Set or update the long description of a todo item.

## Usage

```bash
aux4 todo describe <name> --id <PREFIX-NNN> --description <text> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--id` | Task id, e.g. SPR-001 (required) | |
| `--description` | Long description text | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo describe "sprint-1" --id SPR-001 --description "Import the next 5 IKEA products with verified URLs"
```

```text
SPR-001 in 'sprint-1' description updated.
```
