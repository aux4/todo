# Todo Error Handling Tests

Tests for error conditions and edge cases.

```beforeAll
rm -f .todo.json
```

```afterAll
rm -f .todo.json
```

## Test 1: Basic operations work

### should create todo for subsequent tests

```execute
aux4 todo new "Test" --item "Item 1"
```

```expect
Todo 'Test' created.
```

### should verify todo was created

```execute
aux4 todo list
```

```expect
Todo Lists:
  Test (0/1)
```

## Test 2: Delete entire todo

### should create todo to delete

```execute
aux4 todo new "ToDelete" --item "Item"
```

```expect
Todo 'ToDelete' created.
```

### should delete the todo

```execute
aux4 todo delete "ToDelete"
```

```expect
Todo 'ToDelete' removed.
```

### should verify todo was deleted

```execute
aux4 todo list
```

```expect
Todo Lists:
  Test (0/1)
```
