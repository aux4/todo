# todo archive list

List the archived items of a todo list, using the same slim one-line-per-item format as `aux4 todo view`. This is the only way to see archived items — they are hidden from `view` and from `list` counts.

## Usage

```bash
aux4 todo archive list <name> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo archive list "sprint-1"
```

```text
## sprint-1 [SPR] (archived)
  SPR-002: [x] O̶l̶d̶ ̶m̶i̶g̶r̶a̶t̶i̶o̶n̶ ̶t̶a̶s̶k̶
  SPR-007: [ ] Deferred cleanup
```
