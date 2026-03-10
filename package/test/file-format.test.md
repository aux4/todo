# Todo File Format Tests

Tests for JSON file format and special characters.

```beforeEach
rm -f .todo.json
```

```afterAll
rm -f .todo.json
```

## Test 1: Verify JSON file creation

### should create todo and check file

```execute
aux4 todo new "FileTest" --item "Check format"; cat .todo.json
```

```expect
Todo 'FileTest' created.
{
  "FileTest": [
    {
      "text": "Check format",
      "completed": false
    }
  ]
}
```

## Test 2: Multiple todos in file

### should create todos and check format

```execute
aux4 todo new "FileTest" --item "Check format"; aux4 todo new "Second" --item "Another item"; cat .todo.json
```

```expect
Todo 'FileTest' created.
Todo 'Second' created.
{
  "FileTest": [
    {
      "text": "Check format",
      "completed": false
    }
  ],
  "Second": [
    {
      "text": "Another item",
      "completed": false
    }
  ]
}
```

## Test 3: Completed items in file

### should create, complete and check format

```execute
aux4 todo new "FileTest" --item "Check format"; aux4 todo new "Second" --item "Another item"; aux4 todo complete "FileTest" --index 0; cat .todo.json
```

```expect
Todo 'FileTest' created.
Todo 'Second' created.
Item 0 in 'FileTest' marked as completed.
{
  "FileTest": [
    {
      "text": "Check format",
      "completed": true
    }
  ],
  "Second": [
    {
      "text": "Another item",
      "completed": false
    }
  ]
}
```

## Test 4: Special characters in names

### should test with dashes and underscores

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo new "Test_Case" --item "Item two"
```

```expect
Todo 'Project-X' created.
Todo 'Test_Case' created.
```

### should verify special names work

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo new "Test_Case" --item "Item two"; aux4 todo list
```

```expect
Todo 'Project-X' created.
Todo 'Test_Case' created.
Todo Lists:
  Project-X (0/1)
  Test_Case (0/1)
```

### should view special named todos

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo view "Project-X"
```

```expect
Todo 'Project-X' created.
## Project-X
  0: [ ] Item one
```

## Test 5: Long item text

### should create todo and add long description

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo add "Project-X" --item "This is a very long todo item description that spans multiple words and tests how the system handles longer text content"
```

```expect
Todo 'Project-X' created.
Item added to 'Project-X'.
```

### should verify long text displays correctly

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo add "Project-X" --item "This is a very long todo item description that spans multiple words and tests how the system handles longer text content"; aux4 todo view "Project-X"
```

```expect
Todo 'Project-X' created.
Item added to 'Project-X'.
## Project-X
  0: [ ] Item one
  1: [ ] This is a very long todo item description that spans multiple words and tests how the system handles longer text content
```

## Test 6: File persistence

### should create todos and check file content

```execute
aux4 todo new "Project-X" --item "Item one"; aux4 todo new "Test_Case" --item "Item two"; aux4 todo add "Project-X" --item "This is a very long todo item description that spans multiple words and tests how the system handles longer text content"; aux4 todo add "Test_Case" --item "Persistence check"; cat .todo.json
```

```expect
Todo 'Project-X' created.
Todo 'Test_Case' created.
Item added to 'Project-X'.
Item added to 'Test_Case'.
{
  "Project-X": [
    {
      "text": "Item one",
      "completed": false
    },
    {
      "text": "This is a very long todo item description that spans multiple words and tests how the system handles longer text content",
      "completed": false
    }
  ],
  "Test_Case": [
    {
      "text": "Item two",
      "completed": false
    },
    {
      "text": "Persistence check",
      "completed": false
    }
  ]
}
```
