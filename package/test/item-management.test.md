# Todo Item Management Tests

Tests for managing items within todo lists.

```beforeAll
rm -f .todo.json
```

```afterAll
rm -f .todo.json
```

## Test 1: Add items to existing todo

### should setup todo and add item

```execute
aux4 todo new "Project" --item "Setup repo"; aux4 todo add "Project" --item "Write tests"
```

```expect
Todo 'Project' created.
Item added to 'Project'.
```

### should verify items were added

```execute
aux4 todo view "Project"
```

```expect
## Project
  0: [ ] Setup repo
  1: [ ] Write tests
```

## Test 2: Toggle item completion

### should mark first item as completed

```execute
aux4 todo complete "Project" --index 0
```

```expect
Item 0 in 'Project' marked as completed.
```

### should show strikethrough formatting

```execute
aux4 todo view "Project"
```

```expect:regex
## Project
  0: \[x\] .*̶.*
  1: \[ \] Write tests
```

### should update progress counter

```execute
aux4 todo list
```

```expect
Todo Lists:
  Project (1/2)
```

## Test 3: Toggle item back to pending

### should mark completed item as pending

```execute
aux4 todo complete "Project" --index 0
```

```expect
Item 0 in 'Project' marked as pending.
```

### should verify no strikethrough

```execute
aux4 todo view "Project"
```

```expect
## Project
  0: [ ] Setup repo
  1: [ ] Write tests
```

## Test 4: Remove specific item

### should remove second item

```execute
aux4 todo remove "Project" --index 1
```

```expect
Item 1 removed from 'Project'.
```

### should verify item was removed

```execute
aux4 todo view "Project"
```

```expect
## Project
  0: [ ] Setup repo
```

### should show updated progress counter

```execute
aux4 todo list
```

```expect
Todo Lists:
  Project (0/1)
```
