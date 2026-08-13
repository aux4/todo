# Multiple Todo Lists

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## multiple lists

### should create and list multiple todos

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo new backlog --prefix BKL --item "B" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (0/1)
  [BKL] backlog (0/1)
```

### should add items to different lists

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo new backlog --prefix BKL --item "B" && aux4 todo add sprint --item "C" && aux4 todo add backlog --item "D" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (0/2)
  [BKL] backlog (0/2)
```

## mixed completion

### should track progress independently

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo new backlog --prefix BKL --item "B" && aux4 todo add sprint --item "C" && aux4 todo complete sprint --id SPR-001 && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [SPR] sprint (1/2)
  [BKL] backlog (0/1)
```

## delete one list

### should only remove the specified list

```execute
aux4 todo new sprint --prefix SPR --item "A" && aux4 todo new backlog --prefix BKL --item "B" && aux4 todo delete sprint && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [BKL] backlog (0/1)
```

## special characters

### should handle dashes and underscores in names

```execute
aux4 todo new "project-x" --prefix PRJ --item "Task" && aux4 todo new "test_case" --prefix TST --item "Task" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [PRJ] project-x (0/1)
  [TST] test_case (0/1)
```
