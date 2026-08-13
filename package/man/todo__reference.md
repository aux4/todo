# todo reference

Add a cross-file reference to resolve foreign task prefixes. This allows subtasks and references to tasks in other todo files.

## Usage

```bash
aux4 todo reference <name> --prefix <PREFIX> --target <file>#<list> [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--prefix` | Foreign prefix to reference (e.g. SEO) | |
| `--target` | Target file and list (e.g. `../seo/.todo.json#seo-tasks`) | |
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo reference "sprint-1" --prefix SEO --target "../seo/.todo.json#seo-tasks"
```

```text
Reference SEO -> ../seo/.todo.json#seo-tasks added to 'sprint-1'.
```

## How it works

When a task ID like `SEO-001` is encountered, the system:
1. Extracts the prefix `SEO`
2. Looks up `references.SEO` in the current list
3. Opens the referenced file and list
4. Resolves the task there
