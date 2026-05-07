# aux4/todo

Todo list manager for aux4. Create and manage multiple todo lists stored in `.todo.json` files. Mark items as completed or pending, list all todos with progress counters, and view specific lists with strikethrough formatting for completed items.

## Installation

```bash
aux4 aux4 pkger install aux4/todo
```

## Commands

### List all todo lists
```bash
aux4 todo list
```

### View a specific todo list
```bash
aux4 todo view "Work Tasks"
```

### Create a new todo list
```bash
aux4 todo new "Project X" --item "Setup environment"
```

### Add item to existing todo
```bash
aux4 todo add "Work Tasks" --item "Schedule meeting"
```

### Remove an item
```bash
aux4 todo remove "Work Tasks" --index 0
```

### Mark item as complete
```bash
aux4 todo complete "Work Tasks" --index 0
```

### Delete entire todo list
```bash
aux4 todo delete "Work Tasks"
```

## Storage

By default, todos are stored in `.todo.json` in the current directory. Use the `--file` flag on any command to specify a different file path.
