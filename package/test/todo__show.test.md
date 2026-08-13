# todo show

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## single item detail

### should print the header meta line and description body

```execute
aux4 todo new sprint --prefix SPR --item "Import products" --assignee "Alex" --description "Import the next 5 IKEA products" && aux4 todo move sprint --id SPR-001 --status doing && aux4 todo show sprint --id SPR-001
```

```expect:partial
## sprint > SPR-001: Import products
Status: doing [~]   Assignee: @Alex

Description:
Import the next 5 IKEA products

Comments: (none)
```

### should show a subtask summary in the meta line

```execute
aux4 todo new sprint --prefix SPR --item "Parent" && aux4 todo subtask sprint --id SPR-001 --item "Child A" && aux4 todo subtask sprint --id SPR-001 --item "Child B" && aux4 todo move sprint --id SPR-002 --status done && aux4 todo show sprint --id SPR-001
```

```expect:partial
## sprint > SPR-001: Parent
Status: open [ ]   Subtasks: 1/2
**
```

## description chunk

```file:.todo.json
{
  "sprint": {
    "prefix": "SPR",
    "counter": 1,
    "order": ["SPR-001"],
    "archived": [],
    "tasks": {
      "SPR-001": {
        "text": "Long one",
        "completed": false,
        "status": "open",
        "description": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBB"
      }
    }
  }
}
```

### should truncate a long description by default

```execute
aux4 todo show sprint --id SPR-001
```

```expect:partial
**truncated — --full for all**
```

### should show the whole description with --full

```execute
aux4 todo show sprint --id SPR-001 --full true
```

```expect:partial
**BBBBBBBBBBBBBBBB
**
```

## comments window

```file:.todo.json
{
  "sprint": {
    "prefix": "SPR",
    "counter": 1,
    "order": ["SPR-001"],
    "archived": [],
    "tasks": {
      "SPR-001": {
        "text": "Task",
        "completed": false,
        "status": "open",
        "comments": [
          { "author": "A", "message": "one", "date": "2026-05-20T10:00:00.000Z" },
          { "author": "B", "message": "two", "date": "2026-05-20T11:00:00.000Z" },
          { "author": "C", "message": "three", "date": "2026-05-20T12:00:00.000Z" },
          { "author": "D", "message": "four", "date": "2026-05-20T13:00:00.000Z" }
        ]
      }
    }
  }
}
```

### should show the last three comments newest first by default

```execute
aux4 todo show sprint --id SPR-001
```

```expect:regex
[\s\S]*Comments \(showing last 3 of 4\):
  \[.*\] D: four
  \[.*\] C: three
  \[.*\] B: two
```

### should honor --comments N

```execute
aux4 todo show sprint --id SPR-001 --comments 1
```

```expect:regex
[\s\S]*Comments \(showing last 1 of 4\):
  \[.*\] D: four
```

## errors

### should fail for a missing item

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo show sprint --id SPR-999 2>&1; true
```

```expect:partial
**
Item 'SPR-999' not found in 'sprint'.
```
