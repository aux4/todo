# Todo Basic Operations Test

Tests for the `aux4 todo` commands to manage todo lists.

```beforeEach
rm -f .todo.json
```

```afterAll
rm -f .todo.json
```

## Test 1: List empty todos

### should show no todos initially

```execute
aux4 todo list
```

```expect
No todos found.
```

## Test 2: Basic todo functionality

### should create and list a simple todo

```execute
aux4 todo new Work --item "Fix bug" && aux4 todo list
```

```expect
Todo 'Work' created.
Todo Lists:
  Work (0/1)
```
