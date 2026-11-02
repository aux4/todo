# todo add

Add a new item to an existing todo list. Returns the generated task ID.

## Usage

```bash
aux4 todo add <name> --item <text> [--assignee <name>] [--description <text>] [--type <kind>] [--goal <goalId>] [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `name` | Todo list name (required) | |
| `--item` | Item text (required) | |
| `--assignee` | Assignee name (optional) | |
| `--description` | Long description (optional) | |
| `--type` | Item kind, e.g. `goal`, `bug`, `feature` | `task` |
| `--goal` | Id of a goal item to link this task to | |
| `--file` | Todo file path | `.todo.json` |

## Item kind

Every item has a semantic kind (`type`), free-form lowercase text. `task` is the implicit default — an item with no `type` (or a legacy `subtask` marker, see below) is a plain task. `view` and `show` only render a `[kind]` tag when the kind isn't `task`, so default-task output is unchanged. Subtask-ness is a separate concept, derived from `parent` — a subtask can have any kind (see `aux4 todo subtask`).

## Goal linking

A top-level task can be linked to a goal item (an item whose kind is `goal`) via `--goal <goalId>`. The goal can live in any list in the same file — it's resolved by id. Use `aux4 todo link`/`aux4 todo unlink` to change the link later, and `aux4 todo goals` to see rolled-up progress. Subtasks cannot carry a goal link directly.

## Example

```bash
aux4 todo add "sprint-1" --item "SEO audit" --assignee "Sophia"
```

```text
SPR-002 added to 'sprint-1'.
```

Create a bug and link it to an existing goal:

```bash
aux4 todo add "sprint-1" --item "Fix checkout crash" --type bug --goal SPR-001
```

```text
SPR-003 added to 'sprint-1'.
```
