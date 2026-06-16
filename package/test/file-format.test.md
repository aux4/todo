# Todo File Format

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## json structure

### should create list with prefix counter and tasks

```execute
aux4 todo new sprint --prefix SPR --item "Task" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const l=d.sprint; console.log('prefix:', l.prefix); console.log('counter:', l.counter); console.log('hasTasks:', typeof l.tasks === 'object'); console.log('taskId:', Object.keys(l.tasks)[0]);"
```

```expect:partial
**
prefix: SPR
counter: 1
hasTasks: true
taskId: SPR-001
```

### should store assignee

```execute
aux4 todo new sprint --prefix SPR --item "Task" --assignee "Alice" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.sprint.tasks['SPR-001'].assignee);"
```

```expect:partial
**
Alice
```

### should store description

```execute
aux4 todo new sprint --prefix SPR --item "Task" --description "Details" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.sprint.tasks['SPR-001'].description);"
```

```expect:partial
**
Details
```

### should store subtask with type and parent

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const t=d.sprint.tasks['SPR-002']; console.log('type:', t.type); console.log('parent:', t.parent); console.log('text:', t.text);"
```

```expect:partial
**
type: subtask
parent: SPR-001
text: Child
```

### should store reference

```execute
aux4 todo new sprint --prefix SPR && aux4 todo reference sprint --prefix SEO --target "../seo/.todo.json#seo-tasks" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.sprint.references.SEO);"
```

```expect:partial
**
../seo/.todo.json#seo-tasks
```

### should increment counter sequentially

```execute
aux4 todo new sprint --prefix SPR && aux4 todo add sprint --item "A" && aux4 todo add sprint --item "B" && aux4 todo add sprint --item "C" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('counter:', d.sprint.counter); console.log('ids:', Object.keys(d.sprint.tasks).join(','));"
```

```expect:partial
**
counter: 3
ids: SPR-001,SPR-002,SPR-003
```

## migration

### should migrate old array format

```file:.todo.json
{"legacy":[{"text":"Old task","completed":true},{"text":"Another","completed":false}]}
```

```execute
aux4 todo add legacy --item "New" && aux4 todo view legacy
```

```expect:regex
LEG-003 added to 'legacy'\.
## legacy \[LEG\]
  LEG-001: \[x\] .*̶.*
  LEG-002: \[ \] Another
  LEG-003: \[ \] New
```

### should migrate old flat object format

```file:.todo.json
{"old":{"aabb1122":{"text":"Task A","completed":false,"order":0},"ccdd3344":{"text":"Sub B","completed":false,"order":1,"type":"subtask","parent":"aabb1122"}}}
```

```execute
aux4 todo view old
```

```expect:partial
## old [OLD]
  OLD-001: [ ] Task A (1 subtask: 0/1)
```

### should remap subtask parent refs on migration

```file:.todo.json
{"old":{"aabb1122":{"text":"Parent","completed":false,"order":0},"ccdd3344":{"text":"Child","completed":false,"order":1,"type":"subtask","parent":"aabb1122"}}}
```

```execute
aux4 todo subtasks old --id OLD-001
```

```expect:partial
## old > OLD-001: Parent
  OLD-002: [ ] Child
```
