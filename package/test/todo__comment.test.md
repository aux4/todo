# Todo Comments

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## add comment

### should add a comment

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Urgent"
```

```expect:partial
**
Comment added to SPR-001 in 'sprint'.
```

### should show comment count in view

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "First" && aux4 todo comment sprint --id SPR-001 --author "B" --message "Second" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task (2 comments)
```

### should show single comment label

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "Only" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task (1 comment)
```

## view comments

### should show comments with timestamp

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Urgent" && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
## sprint > SPR-001: Task — showing 1–1 of 1
  \[.*\] Alice: Urgent
```

### should show multiple comments newest first

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "First" && aux4 todo comment sprint --id SPR-001 --author "B" --message "Second" && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
.*
## sprint > SPR-001: Task — showing 1–2 of 2
  \[.*\] B: Second
  \[.*\] A: First
```

### should show no comments when empty

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comments sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Task — showing 0–0 of 0
  (no comments)
```
