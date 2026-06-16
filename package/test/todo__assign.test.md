# todo assign

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## assign an item

### should report the assignment

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo assign sprint --id SPR-001 --assignee "Alice"
```

```expect:partial
**
SPR-001 in 'sprint' assigned to Alice.
```

### should show the assignee in the view

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo assign sprint --id SPR-001 --assignee "Alice" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task @Alice
```

### should reassign to a different person

```execute
aux4 todo new sprint --prefix SPR --item "Task" --assignee "Alice" && aux4 todo assign sprint --id SPR-001 --assignee "Bob" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task @Bob
```

## unassign an item

### should report the item as unassigned

```execute
aux4 todo new sprint --prefix SPR --item "Task" --assignee "Alice" && aux4 todo assign sprint --id SPR-001
```

```expect:partial
**
SPR-001 in 'sprint' unassigned.
```

### should remove the assignee from the view

```execute
aux4 todo new sprint --prefix SPR --item "Task" --assignee "Alice" && aux4 todo assign sprint --id SPR-001 && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
```

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo assign sprint --id SPR-999 --assignee "Alice" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
