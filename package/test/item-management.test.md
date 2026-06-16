# Todo Item Management

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## complete

### should mark item as completed

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo complete sprint --id SPR-001
```

```expect:partial
**
SPR-001 in 'sprint' marked as completed.
```

### should show strikethrough on completed item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo complete sprint --id SPR-001 && aux4 todo view sprint
```

```expect:regex
.*
.*
## sprint \[SPR\]
  SPR-001: \[x\] .*̶.*
```

### should toggle back to pending

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo complete sprint --id SPR-001 && aux4 todo complete sprint --id SPR-001
```

```expect:partial
**
SPR-001 in 'sprint' marked as completed.
SPR-001 in 'sprint' marked as pending.
```

### should update progress counter

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo add sprint --item "B" && aux4 todo complete sprint --id SPR-001 && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (1/2)
```

### should set explicit status

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo complete sprint --id SPR-001 --status true
```

```expect:partial
**
SPR-001 in 'sprint' marked as completed.
```

## remove

### should remove an item by id

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo add sprint --item "B" && aux4 todo remove sprint --id SPR-001 && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-002: [ ] B
```

## assign

### should assign an item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo assign sprint --id SPR-001 --assignee "Alice" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task @Alice
```

### should unassign an item

```execute
aux4 todo new sprint --prefix SPR --item "Task" --assignee "Alice" && aux4 todo assign sprint --id SPR-001 && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
```

## describe

### should set description

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo describe sprint --id SPR-001 --description "Details" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
              Details
```
