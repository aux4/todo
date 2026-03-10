# @aux4/todo

A todo list manager for aux4 that stores todo lists in `.todo.json` files.

## Features

- Create and manage multiple todo lists in JSON format
- Mark items as completed or pending
- List all todos with progress counters
- View specific todos with strikethrough formatting for completed items
- Add, remove, and complete items in todo lists

## File Format

Todo files use JSON with list names as object keys:

```json
{
  "Work Tasks": [
    { "text": "Review pull request", "completed": false },
    { "text": "Update documentation", "completed": true },
    { "text": "Fix bug in login", "completed": false }
  ],
  "Personal": [
    { "text": "Buy groceries", "completed": true },
    { "text": "Call dentist", "completed": false }
  ]
}
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

## Programmatic Usage

You can also use the todo manager programmatically:

```javascript
import { listTodos, viewTodo, addTodo } from '@aux4/todo';

// List all todos
const todos = await listTodos('.todo.json');

// View specific todo
const workTasks = await viewTodo('Work Tasks', '.todo.json');

// Create new todo
await addTodo('Shopping', ['Milk', 'Bread', 'Eggs'], '.todo.json');
```

## File Location

By default, todos are stored in `.todo.json` in the current directory. You can specify a different file path with the `--file` flag.
