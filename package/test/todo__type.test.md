# Todo Item Kind (type)

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## create with a kind

### should create a list's initial item with a kind

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] [goal] Ship v2
```

### should add an item with a kind

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Fix crash" --type bug && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] [goal] Ship v2
  SPR-002: [ ] [bug] Fix crash
```

### should default to no kind tag (plain task)

```execute
aux4 todo new sprint --prefix SPR --item "Plain task" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Plain task
```

### should show the kind in show when non-default

```execute
aux4 todo new sprint --prefix SPR --item "Fix crash" --type bug && aux4 todo show sprint --id SPR-001
```

```expect:partial
**
Status: open [ ]   Type: bug
```

### should not show a type line for a plain task

```execute
aux4 todo new sprint --prefix SPR --item "Plain task" && aux4 todo show sprint --id SPR-001
```

```expect:partial
## sprint > SPR-001: Plain task
Status: open [ ]

Comments: (none)
```

## typed subtask

### should create a subtask with an explicit kind, still a subtask structurally

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Fix regression" --type bug && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] [bug] Fix regression
```

### should still count a typed subtask toward the parent's subtask total

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Fix regression" --type bug && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Parent (1 subtask: 0/1)
```

## view --type filter

### should filter view to a single kind

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Fix crash" --type bug && aux4 todo add sprint --item "Write docs" && aux4 todo view sprint --status all --type bug
```

```expect:partial
**
## sprint [SPR]
  SPR-002: [ ] [bug] Fix crash
```

### should show every kind when --type is omitted

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Fix crash" --type bug && aux4 todo view sprint --status all
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] [goal] Ship v2
  SPR-002: [ ] [bug] Fix crash
```

## reject goal subtasks

### should reject --type goal on subtask

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child" --type goal 2>&1; true
```

```expect:partial
**
Cannot create a subtask with type 'goal'*?
```
