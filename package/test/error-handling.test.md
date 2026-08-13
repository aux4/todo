# Todo Error Handling

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## duplicate todo

### should error when creating duplicate

```execute
aux4 todo new sprint --prefix SPR; aux4 todo new sprint --prefix SPR 2>&1; true
```

```expect:partial
**
Todo 'sprint' already exists.
```

## missing todo

### should error when viewing nonexistent todo

```execute
aux4 todo view missing 2>&1; true
```

```expect
Todo 'missing' not found.
```

### should error when adding to nonexistent todo

```execute
aux4 todo add missing --item "Task" 2>&1; true
```

```expect
Todo 'missing' not found.
```

### should error when deleting nonexistent todo

```execute
aux4 todo delete missing 2>&1; true
```

```expect
Todo 'missing' not found.
```

## missing item

### should error when completing nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo complete sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when assigning nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo assign sprint --id SPR-999 --assignee "Alice" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when commenting on nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo comment sprint --id SPR-999 --author "A" --message "Hi" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when adding subtask to nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo subtask sprint --id SPR-999 --item "Sub" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when describing nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo describe sprint --id SPR-999 --description "Details" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when removing nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo remove sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when viewing comments on nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo comments sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```

### should error when viewing subtasks of nonexistent item

```execute
aux4 todo new sprint --prefix SPR; aux4 todo subtasks sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
