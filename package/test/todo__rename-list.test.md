# todo rename-list

```beforeEach
rm -f .todo.json .todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock
```

## rename a list

### should report the list was renamed

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo rename-list sprint --newName "sprint-2"
```

```expect:partial
**
Todo 'sprint' renamed to 'sprint-2'.
```

### should move all items under the new name

```execute
aux4 todo new sprint --prefix SPR --item "First" && aux4 todo add sprint --item "Second" && aux4 todo rename-list sprint --newName "sprint-2" && aux4 todo view "sprint-2"
```

```expect:partial
**
## sprint-2 [SPR]
  SPR-001: [ ] First
  SPR-002: [ ] Second
```

### should leave the old name gone

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo rename-list sprint --newName "sprint-2" && aux4 todo view sprint 2>&1; true
```

```expect:partial
**
Todo 'sprint' not found.
```

### should preserve prefix counter order archived and references

```execute
aux4 todo new sprint --prefix SPR --item "Keep A" && aux4 todo add sprint --item "Archive me" && aux4 todo add sprint --item "Keep B" && aux4 todo archive add sprint --id SPR-002 && aux4 todo reference sprint --prefix SEO --target "seo.todo.json#seo-tasks" && aux4 todo rename-list sprint --newName "sprint-2" && cat .todo.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const l=d['sprint-2']; console.log('exists:', !!l); console.log('prefix:', l.prefix); console.log('counter:', l.counter); console.log('order:', l.order.join(',')); console.log('archived:', l.archived.join(',')); console.log('ref:', l.references.SEO); console.log('oldGone:', !('sprint' in d));"
```

```expect:partial
**
exists: true
prefix: SPR
counter: 3
order: SPR-001,SPR-003
archived: SPR-002
ref: seo.todo.json#seo-tasks
oldGone: true
```

### should keep the list in the same position among multiple lists

```execute
aux4 todo new alpha --prefix ALP --item "A" && aux4 todo new beta --prefix BET --item "B" && aux4 todo new gamma --prefix GAM --item "C" && aux4 todo rename-list beta --newName "beta-2" && aux4 todo list
```

```expect:partial
**
Todo Lists:
  [ALP] alpha (0/1)
  [BET] beta-2 (0/1)
  [GAM] gamma (0/1)
```

## errors

### should fail when the current list does not exist

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo rename-list missing --newName "other" 2>&1; true
```

```expect:partial
**
Todo 'missing' not found.
```

### should reject a duplicate new list name

```execute
aux4 todo new sprint --prefix SPR --item "Task" && aux4 todo new backlog --prefix BKL --item "Task" && aux4 todo rename-list sprint --newName "backlog" 2>&1; true
```

```expect:partial
**
Todo 'backlog' already exists.
```
