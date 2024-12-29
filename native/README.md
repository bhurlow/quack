# QuackDB

A native macOS application that demonstrates the use of DuckDB in a SwiftUI interface. This application provides a simple SQL query interface with results displayed in a native table view.

## Features

- Native macOS UI built with SwiftUI
- Integration with DuckDB for data storage and querying
- Live query execution with Command+Return shortcut
- Error handling and display
- Sample data table included

## Requirements

- macOS 14.0 or later
- Xcode 15.0 or later

## Getting Started

1. Open the project in Xcode
2. Wait for Swift Package Manager to resolve dependencies
3. Build and run the project (⌘R)

## Usage

The app comes with a sample table called `sample_data` with three columns:
- id (INTEGER)
- name (VARCHAR)
- value (DOUBLE)

You can query this table using standard SQL. For example:
```sql
SELECT * FROM sample_data
SELECT * FROM sample_data WHERE value > 15
SELECT name, value FROM sample_data ORDER BY value DESC
```

## Dependencies

- [DuckDB Swift](https://github.com/duckdb/duckdb-swift) - Swift bindings for DuckDB
