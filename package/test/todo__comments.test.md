# todo comments

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## view comments

### should show a comment with timestamp

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Urgent" && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
## sprint > SPR-001: Task
  \[.*\] Alice: Urgent
```

### should show multiple comments in order

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "First" && aux4 todo comment sprint --id SPR-001 --author "B" --message "Second" && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
.*
## sprint > SPR-001: Task
  \[.*\] A: First
  \[.*\] B: Second
```

### should show no comments when empty

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comments sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Task
  (no comments)
```

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comments sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
