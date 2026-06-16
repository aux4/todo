# Todo Cross-File References

```beforeEach
rm -f .todo.json .todo.json.lock seo.todo.json seo.todo.json.lock
```

```afterAll
rm -f .todo.json .todo.json.lock seo.todo.json seo.todo.json.lock
```

## add reference

### should add a reference to another file

```execute
aux4 todo new sprint --prefix SPR && aux4 todo reference sprint --prefix SEO --target "seo.todo.json#seo-tasks"
```

```expect:partial
**
Reference SEO -> seo.todo.json#seo-tasks added to 'sprint'.
```

### should reject invalid prefix

```execute
aux4 todo new sprint --prefix SPR && aux4 todo reference sprint --prefix "bad" --target "file.json" 2>&1; true
```

```expect:partial
**
Prefix must be 2-10 uppercase letters*?
```

## resolve foreign tasks

### should view subtasks from referenced file

```execute
aux4 todo new sprint --prefix SPR --item "Import" --file .todo.json && aux4 todo new seo-tasks --prefix SEO --item "Crawl check" --file seo.todo.json && aux4 todo reference sprint --prefix SEO --target "seo.todo.json#seo-tasks" --file .todo.json && aux4 todo subtask sprint --id SPR-001 --item "Verify URLs" --file .todo.json && aux4 todo view sprint --file .todo.json
```

```expect:partial
**
## sprint [SPR]
  SPR-001: [ ] Import (1 subtask: 0/1)
```
