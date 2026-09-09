# todo rename

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## rename an item

### should report the item was renamed

```execute
aux4 todo new sprint --prefix SPR --item "Old title" && aux4 todo rename sprint --id SPR-001 --text "New title"
```

```expect:partial
**
SPR-001 in 'sprint' renamed.
```

### should change the text shown in the view

```execute
aux4 todo new sprint --prefix SPR --item "Old title" && aux4 todo rename sprint --id SPR-001 --text "New title" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] New title
```

### should preserve status assignee and description

```execute
aux4 todo new sprint --prefix SPR --item "Old title" --assignee "Alice" --description "Details" && aux4 todo move sprint --id SPR-001 --status doing && aux4 todo rename sprint --id SPR-001 --text "New title" && aux4 todo show sprint --id SPR-001
```

```expect:partial
## sprint > SPR-001: New title
Status: doing [~]   Assignee: @Alice

Description:
Details
**
```

### should rename a subtask

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Old child" && aux4 todo rename sprint --id SPR-002 --text "New child" && aux4 todo subtasks sprint --id SPR-001
```

```expect:partial
**
## sprint > SPR-001: Parent
  SPR-002: [ ] New child
```

## json output

```beforeEach
rm -f .todo.json .todo.json.lock
aux4 todo new sprint --prefix SPR --item "Old title"
```

### should return json when asked

```execute
aux4 todo rename sprint --id SPR-001 --text "New title" --format json
```

```expect:json
{
  "id": "SPR-001",
  "text": "New title"
}
```

## errors

### should reject empty text

```execute
aux4 todo new sprint --prefix SPR --item "Old title" && aux4 todo rename sprint --id SPR-001 --text "" 2>&1; true
```

```expect:partial
**
Item text cannot be empty.
```

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Old title" && aux4 todo rename sprint --id SPR-999 --text "New" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
