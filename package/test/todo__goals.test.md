# Todo Goals (link / unlink / goals rollup)

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## link and rollup

### should report no goals when there are none

```execute
aux4 todo new sprint --prefix SPR --item "Plain task" && aux4 todo goals
```

```expect:partial
**
Goals:
  (no goals)
```

### should link a task to a goal

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" --goal SPR-001 && aux4 todo goals
```

```expect:partial
**
SPR-002 added to 'sprint'.
Goals:
  SPR-001: [ ] Ship v2 [sprint] (0/1)
```

### should roll up progress as linked tasks complete, including their subtasks

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" --goal SPR-001 && aux4 todo subtask sprint --id SPR-002 --item "Sub A1" && aux4 todo complete sprint --id SPR-003 && aux4 todo goals
```

```expect:partial
**
Goals:
  SPR-001: [ ] Ship v2 [sprint] (1/2)
```

### should flag a goal whose linked tasks are all done

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" --goal SPR-001 && aux4 todo complete sprint --id SPR-002 && aux4 todo goals
```

```expect:partial
**
Goals:
  SPR-001: [ ] Ship v2 [sprint] (1/1) — all linked tasks done
```

### should keep goal completion manual (completing all linked tasks does not complete the goal)

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" --goal SPR-001 && aux4 todo complete sprint --id SPR-002 && aux4 todo view sprint --status all --type goal
```

```expect:partial
**
  SPR-001: [ ] [goal] Ship v2
```

## link command (explicit)

### should link an existing task via the link command

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" && aux4 todo link sprint --id SPR-002 --goal SPR-001 && aux4 todo goals
```

```expect:partial
**
SPR-002 in 'sprint' linked to goal SPR-001.
Goals:
  SPR-001: [ ] Ship v2 [sprint] (0/1)
```

### should allow linking a task from a different list (cross-list)

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo new backlog --prefix BKL --item "Other task" && aux4 todo link backlog --id BKL-001 --goal SPR-001 && aux4 todo goals
```

```expect:partial
**
BKL-001 in 'backlog' linked to goal SPR-001.
Goals:
  SPR-001: [ ] Ship v2 [sprint] (0/1)
```

### should unlink a task from its goal

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Task A" --goal SPR-001 && aux4 todo unlink sprint --id SPR-002 && aux4 todo goals
```

```expect:partial
**
SPR-002 in 'sprint' unlinked from its goal.
Goals:
  SPR-001: [ ] Ship v2 [sprint] (0/0)
```

## errors

### should reject linking to a goal that does not exist

```execute
aux4 todo new sprint --prefix SPR --item "Task A" && aux4 todo link sprint --id SPR-001 --goal SPR-999 2>&1; true
```

```expect:partial
**
Goal 'SPR-999' not found.
```

### should reject linking to an item that is not a goal

```execute
aux4 todo new sprint --prefix SPR --item "Task A" && aux4 todo add sprint --item "Task B" && aux4 todo link sprint --id SPR-002 --goal SPR-001 2>&1; true
```

```expect:partial
**
'SPR-001' is not a goal.
```

### should reject linking an item to itself

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo link sprint --id SPR-001 --goal SPR-001 2>&1; true
```

```expect:partial
**
Item 'SPR-001' cannot be linked to itself.
```

### should reject linking a subtask to a goal

```execute
aux4 todo new sprint --prefix SPR --item "Ship v2" --type goal && aux4 todo add sprint --item "Parent" && aux4 todo subtask sprint --id SPR-002 --item "Child" && aux4 todo link sprint --id SPR-003 --goal SPR-001 2>&1; true
```

```expect:partial
**
Cannot link a subtask to a goal. Link its parent instead.
```
