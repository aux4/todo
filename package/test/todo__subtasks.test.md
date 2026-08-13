# todo subtasks

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## view subtasks

### should list all subtasks of a parent

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo subtask sprint --id SPR-001 --item "B" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] A
  SPR-003: [ ] B
```

### should show the assignee on a subtask

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child" --assignee "Alice" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] Child @Alice
```

### should reflect completed subtasks

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo complete sprint --id SPR-002 && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [x] *?
```

### should show no subtasks when none exist

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  (no subtasks)
```

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtasks sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
