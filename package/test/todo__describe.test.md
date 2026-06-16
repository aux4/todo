# todo describe

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## set a description

### should report the description was updated

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo describe sprint --id SPR-001 --description "Details"
```

```expect:partial
**
SPR-001 in 'sprint' description updated.
```

### should show the description under the item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo describe sprint --id SPR-001 --description "Import the next 5 products" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
              Import the next 5 products
```

### should overwrite an existing description

```execute
aux4 todo new sprint --prefix SPR --item "Task" --description "Old" && aux4 todo describe sprint --id SPR-001 --description "New" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
              New
```

## clear a description

### should remove the description from the view

```execute
aux4 todo new sprint --prefix SPR --item "Task" --description "Old" && aux4 todo describe sprint --id SPR-001 --description "" && aux4 todo view sprint
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Task
```

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo describe sprint --id SPR-999 --description "x" 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
