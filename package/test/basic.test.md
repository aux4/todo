# Todo Basic Operations

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## list

### should show no todos initially

```execute
aux4 todo list
```

```expect
No todos found.
```

### should list todo with prefix and progress

```execute
aux4 todo new sprint --prefix SPR --item "Fix bug" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (0/1)
```

### should show empty label for list without items

```execute
aux4 todo new sprint --prefix SPR && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (empty)
```

## new

### should create a todo list with prefix

```execute
aux4 todo new sprint --prefix SPR
```

```expect
Todo 'sprint' [SPR] created.
```

### should create with initial item using prefix-based ID

```execute
aux4 todo new sprint --prefix SPR --item "Fix bug" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Fix bug
```

### should create with assignee

```execute
aux4 todo new sprint --prefix SPR --item "Fix bug" --assignee "Alice" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Fix bug @Alice
```

### should create with description

```execute
aux4 todo new sprint --prefix SPR --item "Fix bug" --description "Login crashes" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Fix bug
              Login crashes
```

### should reject invalid prefix

```execute
aux4 todo new sprint --prefix "ab" 2>&1; true
```

```expect:partial
Prefix must be 2-10 uppercase letters*?
```

### should reject duplicate prefix

```execute
aux4 todo new a --prefix SPR && aux4 todo new b --prefix SPR 2>&1; true
```

```expect:partial
**
Prefix 'SPR' already used by 'a'.
```

## add

### should add item with sequential ID

```execute
aux4 todo new sprint --prefix SPR && aux4 todo add sprint --item "A" && aux4 todo add sprint --item "B" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] A
  SPR-002: [ ] B
```

### should add item with assignee and description

```execute
aux4 todo new sprint --prefix SPR && aux4 todo add sprint --item "Deploy" --assignee "Bob" --description "Staging first" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Deploy @Bob
              Staging first
```

## view

### should show empty todo

```execute
aux4 todo new sprint --prefix SPR && aux4 todo view sprint
```

```expect
Todo 'sprint' [SPR] created.
## sprint [SPR]
  (no items)
```

## delete

### should delete a todo list

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo delete sprint && aux4 todo list
```

```expect:partial
**
No todos found.
```
