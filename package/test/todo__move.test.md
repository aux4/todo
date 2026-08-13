# todo move

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## status field on add

### should default new items to open

```execute
aux4 todo new sprint --prefix SPR --item "First task" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
**
status: open
completed: false
```

## deriving status from legacy files

### should derive status from completed when the status field is absent

```file:.todo.json
{
  "legacy": {
    "prefix": "LEG",
    "counter": 2,
    "tasks": {
      "LEG-001": {
        "text": "Done legacy",
        "completed": true,
        "order": 0
      },
      "LEG-002": {
        "text": "Open legacy",
        "completed": false,
        "order": 1
      }
    }
  }
}
```

```execute
aux4 todo view legacy --status all
```

```expect:partial
## legacy [LEG]
  LEG-001: [x] **
  LEG-002: [ ] Open legacy
```

### should not add status to untouched legacy items when moving another item

```file:.todo.json
{
  "legacy": {
    "prefix": "LEG",
    "counter": 2,
    "tasks": {
      "LEG-001": {
        "text": "Done legacy",
        "completed": true,
        "order": 0
      },
      "LEG-002": {
        "text": "Open legacy",
        "completed": false,
        "order": 1
      }
    }
  }
}
```

```execute
aux4 todo move legacy --id LEG-002 --status doing && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('LEG-001 hasStatus:', 'status' in d.legacy.tasks['LEG-001']); console.log('LEG-001 completed:', d.legacy.tasks['LEG-001'].completed); console.log('LEG-002 status:', d.legacy.tasks['LEG-002'].status); console.log('LEG-002 completed:', d.legacy.tasks['LEG-002'].completed);"
```

```expect:partial
LEG-002 in 'legacy' moved to doing.
LEG-001 hasStatus: false
LEG-001 completed: true
LEG-002 status: doing
LEG-002 completed: false
```

## moving between statuses

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Task"
```

### should move an item to doing

```execute
aux4 todo move sprint --id SPR-001 --status doing && aux4 todo view sprint
```

```expect:partial
SPR-001 in 'sprint' moved to doing.
## sprint [SPR]
  SPR-001: [~] Task
```

### should move an item to done and set completed true

```execute
aux4 todo move sprint --id SPR-001 --status done && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
SPR-001 in 'sprint' moved to done.
status: done
completed: true
```

### should move a done item back to open and clear completed

```execute
aux4 todo move sprint --id SPR-001 --status done && aux4 todo move sprint --id SPR-001 --status open && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
status: open
completed: false
```

## complete and status stay in sync

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Task"
```

### should set status done when toggled to complete

```execute
aux4 todo complete sprint --id SPR-001 && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
SPR-001 in 'sprint' marked as completed.
status: done
completed: true
```

### should set status open when completed is set false

```execute
aux4 todo complete sprint --id SPR-001 --status true && aux4 todo complete sprint --id SPR-001 --status false && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
SPR-001 in 'sprint' marked as pending.
status: open
completed: false
```

### should reset status to open when a done item is toggled back

```execute
aux4 todo complete sprint --id SPR-001 --status true && aux4 todo complete sprint --id SPR-001 && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-001']; console.log('status:', t.status); console.log('completed:', t.completed);"
```

```expect:partial
SPR-001 in 'sprint' marked as pending.
status: open
completed: false
```

## moving subtasks

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Parent"
aux4 todo subtask sprint --id SPR-001 --item "Child"
```

### should move a subtask to doing

```execute
aux4 todo move sprint --id SPR-002 --status doing && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
SPR-002 in 'sprint' moved to doing.
## sprint > SPR-001: Parent
  SPR-002: [~] Child
```

## error handling

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Task"
```

### should reject an invalid status

```execute
aux4 todo move sprint --id SPR-001 --status blocked
```

```error:partial
Invalid status 'blocked'. Must be one of: open, doing, done.
```

### should error when the item id does not exist

```execute
aux4 todo move sprint --id SPR-999 --status doing
```

```error:partial
Item 'SPR-999' not found in 'sprint'.
```
