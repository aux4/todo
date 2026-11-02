# Todo Legacy Subtask Type Migration

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## legacy type:"subtask" marker

```file:.todo.json
{
  "legacy": {
    "prefix": "LEG",
    "counter": 2,
    "order": ["LEG-001", "LEG-002"],
    "archived": [],
    "tasks": {
      "LEG-001": { "text": "Parent", "completed": false, "status": "open" },
      "LEG-002": { "text": "Child", "completed": false, "status": "open", "type": "subtask", "parent": "LEG-001" }
    }
  }
}
```

### should keep the legacy type on disk after a pure read

```execute
aux4 todo view legacy --status all && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('type:', d.legacy.tasks['LEG-002'].type);"
```

```expect:partial
**
type: subtask
```

### should still recognize it as a subtask (not shown in view, counted on the parent)

```execute
aux4 todo view legacy --status all
```

```expect:partial
## legacy [LEG]
  LEG-001: [ ] Parent (1 subtask: 0/1)
```

### should strip the redundant legacy type the next time the list is written

```execute
aux4 todo move legacy --id LEG-001 --status doing && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('type:', JSON.stringify(d.legacy.tasks['LEG-002'].type)); console.log('parent:', d.legacy.tasks['LEG-002'].parent);"
```

```expect:partial
**
type: undefined
parent: LEG-001
```
