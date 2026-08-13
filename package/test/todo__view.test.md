# todo view

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## slim index

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Open task"
aux4 todo add sprint --item "Doing task"
aux4 todo add sprint --item "Done task"
aux4 todo describe sprint --id SPR-001 --description "This body must not appear in view"
aux4 todo move sprint --id SPR-002 --status doing
aux4 todo move sprint --id SPR-003 --status done
```

### should print one line per item without the description body

```execute
aux4 todo view sprint --status all
```

```expect:regex
## sprint \[SPR\]
  SPR-001: \[ \] Open task \+desc
  SPR-002: \[~\] Doing task
  SPR-003: \[x\] .*̶.*
```

### should default to open and doing and hide done

```execute
aux4 todo view sprint
```

```expect:partial
## sprint [SPR]
  SPR-001: [ ] Open task +desc
  SPR-002: [~] Doing task
```

### should filter to a single status

```execute
aux4 todo view sprint --status doing
```

```expect:partial
## sprint [SPR]
  SPR-002: [~] Doing task
```

### should reject an invalid status filter

```execute
aux4 todo view sprint --status blocked 2>&1; true
```

```expect:partial
Invalid status 'blocked'. Must be one of: open, doing, done, all.
```

## shape migration

### should rebuild order and archived from a legacy numeric-order file

```file:.todo.json
{
  "legacy": {
    "prefix": "LEG",
    "counter": 3,
    "tasks": {
      "LEG-002": { "text": "Second", "completed": false, "status": "open", "order": 1 },
      "LEG-001": { "text": "First", "completed": false, "status": "open", "order": 0 },
      "LEG-003": { "text": "Archived one", "completed": false, "status": "open", "order": 2, "archived": true }
    }
  }
}
```

```execute
aux4 todo view legacy && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('order:', d.legacy.order.join(',')); console.log('archived:', d.legacy.archived.join(',')); console.log('hasNumericOrder:', 'order' in d.legacy.tasks['LEG-001']); console.log('hasArchivedFlag:', 'archived' in d.legacy.tasks['LEG-003']);"
```

```expect:partial
## legacy [LEG]
  LEG-001: [ ] First
  LEG-002: [ ] Second
order: LEG-001,LEG-002
archived: LEG-003
hasNumericOrder: false
hasArchivedFlag: false
```
