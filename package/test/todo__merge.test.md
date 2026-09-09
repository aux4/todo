# todo merge

Schema-aware combine of multiple todo files into one. Per stream it unions
`tasks`, `order`, and `archived`, takes `counter = max`, and lets the first
(base) file win on any id conflict.

## merging two files

```file:a.json
{
  "alpha": {
    "prefix": "AL",
    "counter": 2,
    "order": ["AL-001", "AL-002"],
    "archived": [],
    "tasks": {
      "AL-001": { "text": "first", "completed": false, "status": "open" },
      "AL-002": { "text": "second", "completed": true, "status": "done" }
    }
  }
}
```

```file:b.json
{
  "alpha": {
    "prefix": "AL",
    "counter": 3,
    "order": ["AL-003"],
    "archived": [],
    "tasks": {
      "AL-003": { "text": "third", "completed": false, "status": "open" }
    }
  },
  "beta": {
    "prefix": "BE",
    "counter": 1,
    "order": ["BE-001"],
    "archived": [],
    "tasks": {
      "BE-001": { "text": "beta one", "completed": false, "status": "open" }
    }
  }
}
```

### should print the merged result to stdout when no --into is given

```execute
aux4 todo merge a.json b.json
```

```expect
{
  "alpha": {
    "prefix": "AL",
    "counter": 3,
    "order": [
      "AL-001",
      "AL-002",
      "AL-003"
    ],
    "archived": [],
    "tasks": {
      "AL-001": {
        "text": "first",
        "completed": false,
        "status": "open"
      },
      "AL-002": {
        "text": "second",
        "completed": true,
        "status": "done"
      },
      "AL-003": {
        "text": "third",
        "completed": false,
        "status": "open"
      }
    }
  },
  "beta": {
    "prefix": "BE",
    "counter": 1,
    "order": [
      "BE-001"
    ],
    "archived": [],
    "tasks": {
      "BE-001": {
        "text": "beta one",
        "completed": false,
        "status": "open"
      }
    }
  }
}
```

### should write the merged result in place with --into

```execute
aux4 todo merge a.json b.json --into merged.json
```

```expect
Merged 2 file(s) into merged.json.
```

### should have all alpha items after an --into merge

```execute
aux4 todo merge a.json b.json --into merged.json && aux4 todo view alpha --file merged.json --status all
```

```expect:partial
## alpha [AL]
  AL-001: [ ] first
  AL-002: *
  AL-003: [ ] third
```

### should list both merged streams

```execute
aux4 todo merge a.json b.json --into merged.json >/dev/null && aux4 todo list --file merged.json
```

```expect
Todo Lists:
  [AL] alpha (1/3)
  [BE] beta (0/1)
```

## id conflicts

```file:base.json
{
  "alpha": {
    "prefix": "AL",
    "counter": 1,
    "order": ["AL-001"],
    "archived": [],
    "tasks": {
      "AL-001": { "text": "base wins", "completed": false, "status": "open" }
    }
  }
}
```

```file:other.json
{
  "alpha": {
    "prefix": "AL",
    "counter": 1,
    "order": ["AL-001"],
    "archived": [],
    "tasks": {
      "AL-001": { "text": "should be ignored", "completed": false, "status": "open" }
    }
  }
}
```

### should keep the base version of a conflicting id

```execute
aux4 todo merge base.json other.json
```

```expect
{
  "alpha": {
    "prefix": "AL",
    "counter": 1,
    "order": [
      "AL-001"
    ],
    "archived": [],
    "tasks": {
      "AL-001": {
        "text": "base wins",
        "completed": false,
        "status": "open"
      }
    }
  }
}
```

### should report the conflict count when writing with --into

```execute
aux4 todo merge base.json other.json --into out.json
```

```expect
Merged 2 file(s) into out.json (1 id conflict(s) kept from base).
```
