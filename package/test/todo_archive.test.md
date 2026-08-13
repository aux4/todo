# todo archive

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Keep A"
aux4 todo add sprint --item "Archive me"
aux4 todo add sprint --item "Keep B"
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## archive add

### should archive an item and report it

```execute
aux4 todo archive add sprint --id SPR-002
```

```expect:partial
SPR-002 archived in 'sprint'.
```

### should move the id from order to archived in storage

```execute
aux4 todo archive add sprint --id SPR-002 && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('order:', d.sprint.order.join(',')); console.log('archived:', d.sprint.archived.join(','));"
```

```expect:partial
**
order: SPR-001,SPR-003
archived: SPR-002
```

### should exclude archived items from view

```execute
aux4 todo archive add sprint --id SPR-002 && aux4 todo view sprint --status all
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Keep A
  SPR-003: [ ] Keep B
```

### should exclude archived items from list counts and show a tally

```execute
aux4 todo archive add sprint --id SPR-002 && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (0/2, 1 archived)
```

### should reject archiving a subtask

```execute
aux4 todo subtask sprint --id SPR-001 --item "Child" && aux4 todo archive add sprint --id SPR-004 2>&1; true
```

```expect:partial
**
Cannot archive a subtask. Archive its parent instead.
```

### should reject archiving an already archived item

```execute
aux4 todo archive add sprint --id SPR-002 && aux4 todo archive add sprint --id SPR-002 2>&1; true
```

```expect:partial
**
Item 'SPR-002' is already archived.
```

## archive list

### should list archived items one line each

```execute
aux4 todo archive add sprint --id SPR-002 && aux4 todo archive list sprint
```

```expect:partial
**
## sprint [SPR] (archived)
  SPR-002: [ ] Archive me
```

### should report when nothing is archived

```execute
aux4 todo archive list sprint
```

```expect:partial
## sprint [SPR] (archived)
  (no archived items)
```

## archive remove

### should restore an archived item to the active list

```execute
aux4 todo archive add sprint --id SPR-002 && aux4 todo archive remove sprint --id SPR-002 && aux4 todo view sprint
```

```expect:partial
SPR-002 unarchived in 'sprint'.
## sprint [SPR]
  SPR-001: [ ] Keep A
  SPR-003: [ ] Keep B
  SPR-002: [ ] Archive me
```

### should reject restoring an item that is not archived

```execute
aux4 todo archive remove sprint --id SPR-001 2>&1; true
```

```expect:partial
Item 'SPR-001' is not archived.
```
