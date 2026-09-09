# todo archive offload

Move archived items out of the live file into a separate archive file to shrink
the ledger. The archive file is a normal todo file, so offloaded history stays
readable with `todo archive list --file <archive>`.

## own-file mode (default archive path)

```file:work.json
{
  "work": {
    "prefix": "WK",
    "counter": 3,
    "order": ["WK-001"],
    "archived": ["WK-002", "WK-003"],
    "tasks": {
      "WK-001": { "text": "active task", "completed": false, "status": "open" },
      "WK-002": { "text": "done and archived", "completed": true, "status": "done", "comments": [{ "author": "me", "message": "finished", "date": "2026-01-01T00:00:00.000Z" }] },
      "WK-003": { "text": "another archived", "completed": true, "status": "done" }
    }
  }
}
```

### should offload archived items to the default archive file

```execute
aux4 todo archive offload work --file work.json
```

```expect
Offloaded 2 archived item(s) from work to work.archive.json.
```

### should leave only active items in the live file

```execute
aux4 todo archive offload work --file work.json >/dev/null && aux4 todo view work --file work.json --status all
```

```expect
## work [WK]
  WK-001: [ ] active task
```

### should drop the archived tally from the live list

```execute
aux4 todo archive offload work --file work.json >/dev/null && aux4 todo list --file work.json
```

```expect
Todo Lists:
  [WK] work (0/1)
```

### should keep the offloaded items readable in the archive file

```execute
aux4 todo archive offload work --file work.json >/dev/null && aux4 todo archive list work --file work.archive.json
```

```expect:partial
## work [WK] (archived)
  WK-002: *
  WK-003: *
```

### should preserve comment history on offloaded items

```execute
aux4 todo archive offload work --file work.json >/dev/null && aux4 todo show work --id WK-002 --file work.archive.json
```

```expect:partial
## work > WK-002: done and archived
**
  ** me: finished
```

## nothing to offload

```file:empty.json
{
  "empty": {
    "prefix": "EMP",
    "counter": 0,
    "order": [],
    "archived": [],
    "tasks": {}
  }
}
```

### should report nothing to offload when there are no archived items

```execute
aux4 todo archive offload empty --file empty.json
```

```expect
Nothing to offload in 'empty'.
```

## --into mode (merge into an existing archive)

```file:live.json
{
  "work": {
    "prefix": "WK",
    "counter": 2,
    "order": ["WK-001"],
    "archived": ["WK-002"],
    "tasks": {
      "WK-001": { "text": "active", "completed": false, "status": "open" },
      "WK-002": { "text": "newly archived", "completed": true, "status": "done" }
    }
  }
}
```

```file:store.json
{
  "work": {
    "prefix": "WK",
    "counter": 5,
    "order": [],
    "archived": ["WK-005"],
    "tasks": {
      "WK-005": { "text": "previously offloaded", "completed": true, "status": "done" }
    }
  }
}
```

### should merge offloaded items into the existing archive, keeping prior records

```execute
aux4 todo archive offload work --file live.json --into store.json >/dev/null && aux4 todo archive list work --file store.json
```

```expect:partial
## work [WK] (archived)
  WK-005: *
  WK-002: *
```

### should remove the offloaded item from the live file

```execute
aux4 todo archive offload work --file live.json --into store.json >/dev/null && aux4 todo list --file live.json
```

```expect
Todo Lists:
  [WK] work (0/1)
```

## restore roundtrip

```file:round.json
{
  "work": {
    "prefix": "WK",
    "counter": 2,
    "order": ["WK-001"],
    "archived": ["WK-002"],
    "tasks": {
      "WK-001": { "text": "active", "completed": false, "status": "open" },
      "WK-002": { "text": "archived", "completed": true, "status": "done" }
    }
  }
}
```

### should restore offloaded items back into the live file via merge

```execute
aux4 todo archive offload work --file round.json >/dev/null && aux4 todo merge round.json round.archive.json --into round.json >/dev/null && aux4 todo archive list work --file round.json
```

```expect:partial
## work [WK] (archived)
  WK-002: *
```
