# Todo Subtasks

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## add subtask

### should add a subtask with sequential ID

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child"
```

```expect:partial
**
SPR-002 added as subtask of SPR-001 in 'sprint'.
```

### should show subtask count in parent view

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo subtask sprint --id SPR-001 --item "B" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Parent (2 subtasks: 0/2)
```

### should add subtask with assignee

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child" --assignee "Alice" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] Child @Alice
```

## view subtasks

### should list all subtasks

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo subtask sprint --id SPR-001 --item "B" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] A
  SPR-003: [ ] B
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

## complete subtask

### should update parent subtask count

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo subtask sprint --id SPR-001 --item "B" && aux4 todo complete sprint --id SPR-002 && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Parent (2 subtasks: 1/2)
```

## list hides subtasks

### should not count subtasks in list totals

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "A" && aux4 todo subtask sprint --id SPR-001 --item "B" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (0/1)
```

## prevent nested subtasks

### should reject subtask of a subtask

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child" && aux4 todo subtask sprint --id SPR-002 --item "Grandchild" 2>&1; true
```

```expect:partial
**
Cannot add subtask to a subtask*?
```

## remove parent

### should remove parent and all subtasks

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo add sprint --item "Other" && aux4 todo subtask sprint --id SPR-001 --item "Child" && aux4 todo remove sprint --id SPR-001 && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-002: [ ] Other
```
