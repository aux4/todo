# todo comment-remove

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## index removal

### should remove the comment at the given index and keep the others

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "A" --message "First" && aux4 todo comment sprint --id SPR-001 --author "B" --message "Second" && aux4 todo comment sprint --id SPR-001 --author "C" --message "Third" && aux4 todo comment-remove sprint --id SPR-001 --index 1 && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
.*
.*
.*
## sprint > SPR-001: Task — showing 1–2 of 2
  \[.*\] C: Third
  \[.*\] A: First
```

## author gate

### should reject removing a comment that belongs to a different author

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Urgent" && aux4 todo comment-remove sprint --id SPR-001 --index 0 --author "Bob" 2>&1; true
```

```expect:partial
**
You can only delete your own comments.
```

### should allow the owning author to remove their own comment

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Urgent" && aux4 todo comment-remove sprint --id SPR-001 --index 0 --author "Alice" && aux4 todo comments sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Task — showing 0–0 of 0
  (no comments)
```

## out-of-range index

### should be a no-op when the index does not exist

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo comment sprint --id SPR-001 --author "Alice" --message "Only" && aux4 todo comment-remove sprint --id SPR-001 --index 5 && aux4 todo comments sprint --id SPR-001
```

```expect:regex
.*
.*
.*
## sprint > SPR-001: Task — showing 1–1 of 1
  \[.*\] Alice: Only
```
