# Multiple Todos Tests

Tests for managing multiple todo lists and complex scenarios.

```beforeAll
rm -f .todo.json
```

```afterAll
rm -f .todo.json
```

## Test 1: Create multiple todos

### should create several todo lists

```execute
aux4 todo new "Work" --item "Review PR"; aux4 todo new "Personal" --item "Buy groceries"; aux4 todo new "Learning" --item "Read docs"
```

```expect
Todo 'Work' created.
Todo 'Personal' created.
Todo 'Learning' created.
```

### should list all todos

```execute
aux4 todo list
```

```expect
Todo Lists:
  Work (0/1)
  Personal (0/1)
  Learning (0/1)
```

## Test 2: Work with specific todos

### should add items to different todos

```execute
aux4 todo add "Work" --item "Deploy code"; aux4 todo add "Personal" --item "Call dentist"
```

```expect
Item added to 'Work'.
Item added to 'Personal'.
```

### should show updated progress

```execute
aux4 todo list
```

```expect
Todo Lists:
  Work (0/2)
  Personal (0/2)
  Learning (0/1)
```

## Test 3: Mixed completion states

### should complete some items

```execute
aux4 todo complete "Work" --index 0; aux4 todo complete "Personal" --index 1; aux4 todo complete "Learning" --index 0
```

```expect
Item 0 in 'Work' marked as completed.
Item 1 in 'Personal' marked as completed.
Item 0 in 'Learning' marked as completed.
```

### should show mixed progress counters

```execute
aux4 todo list
```

```expect
Todo Lists:
  Work (1/2)
  Personal (1/2)
  Learning (1/1)
```

## Test 4: View specific todos

### should view work todo

```execute
aux4 todo view "Work"
```

```expect:regex
## Work
  0: \[x\] .*̶.*
  1: \[ \] Deploy code
```

### should view personal todo

```execute
aux4 todo view "Personal"
```

```expect:regex
## Personal
  0: \[ \] Buy groceries
  1: \[x\] .*̶.*
```

## Test 5: Delete one todo

### should delete learning todo

```execute
aux4 todo delete "Learning"
```

```expect
Todo 'Learning' removed.
```

### should verify only two remain

```execute
aux4 todo list
```

```expect
Todo Lists:
  Work (1/2)
  Personal (1/2)
```

## Test 6: Empty todo handling

### should create todo without initial item

```execute
aux4 todo new "Empty"
```

```expect
Todo 'Empty' created.
```

### should view empty todo

```execute
aux4 todo view "Empty"
```

```expect
## Empty
  (no items)
```

### should show empty todo in list

```execute
aux4 todo list
```

```expect
Todo Lists:
  Work (1/2)
  Personal (1/2)
  Empty (empty)
```
