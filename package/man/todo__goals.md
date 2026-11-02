# todo goals

List every goal item in the file, one line each, with rolled-up progress of the tasks linked to it. A goal is just an item whose kind is `goal` (see `aux4 todo add --type goal`); it can live in any list in the file, and the tasks linked to it (via `aux4 todo link` / `aux4 todo add --goal`) can live in any list too.

Progress counts each linked task and, for any linked task that has subtasks, its subtasks as well — so `(3/5)` means 3 of 5 total units (tasks + their subtasks) are done. When every linked unit is done, the line is flagged with `— all linked tasks done`. Goal completion itself stays manual — `goals` never auto-completes the goal item; you still `aux4 todo complete`/`move` it yourself.

An archived goal is hidden from this listing entirely. Its linked tasks are unaffected by that: a linked task that is itself archived still counts toward its (non-archived) goal's rollup.

## Usage

```bash
aux4 todo goals [--file <path>]
```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `--file` | Todo file path | `.todo.json` |

## Example

```bash
aux4 todo goals
```

```text
Goals:
  SPR-000: [ ] Ship v2 [sprint-1] (3/5)
  SPR-010: [ ] Clean up backlog [backlog] (2/2) — all linked tasks done
```

With nothing linked yet:

```text
Goals:
  (no goals)
```
