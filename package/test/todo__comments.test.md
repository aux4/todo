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

### should default to the last three comments

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "one" && aux4 todo comment sprint --id SPR-001 --author "B" --message "two" && aux4 todo comment sprint --id SPR-001 --author "C" --message "three" && aux4 todo comment sprint --id SPR-001 --author "D" --message "four" && aux4 todo comments sprint --id SPR-001
```

```expect:regex
[\s\S]*## sprint > SPR-001: Task — showing 1–3 of 4
  \[.*\] D: four
  \[.*\] C: three
  \[.*\] B: two
```

### should page older comments with --limit and --offset

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "one" && aux4 todo comment sprint --id SPR-001 --author "B" --message "two" && aux4 todo comment sprint --id SPR-001 --author "C" --message "three" && aux4 todo comment sprint --id SPR-001 --author "D" --message "four" && aux4 todo comments sprint --id SPR-001 --limit 2 --offset 2
```

```expect:regex
[\s\S]*## sprint > SPR-001: Task — showing 3–4 of 4
  \[.*\] B: two
  \[.*\] A: one
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

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comments sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
