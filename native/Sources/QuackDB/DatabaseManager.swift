import Foundation
import DuckDB
import TabularData

struct Row: Identifiable {
                var id: Int
                var name: String
                var value: Double
            }


class DatabaseManager: ObservableObject {
    private var database: Database?
    private var connection: Connection?
    
    @Published var data: [Row] = []
    @Published var error: String?
    
    init() {
        do {
            // Create an in-memory database
            database = try Database(store: .inMemory)
            connection = try database?.connect()
            
            // Create a sample table
            try connection?.execute("""
                CREATE TABLE sample_data (
                    id INTEGER,
                    name VARCHAR,
                    value DOUBLE
                )
            """)
            
            // Insert some sample data
            try connection?.execute("""
                INSERT INTO sample_data VALUES
                (1, 'Alpha', 10.5),
                (2, 'Beta', 20.7),
                (3, 'Gamma', 15.3)
            """)
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func executeQuery(_ query: String) {
        do {
            guard let connection = connection else {
                throw NSError(domain: "DatabaseError", code: -1, userInfo: [NSLocalizedDescriptionKey: "No database connection"])
            }
            
            let result = try connection.query(query)
            let rowCount = result.rowCount
                       
            let idColumn = result[0].cast(to: Int.self)
            let nameColumn = result[1].cast(to: String.self)
            let valueColumn = result[2].cast(to: Double.self)
            
            for i in 0..<rowCount {
                let row = Row(
                    id: idColumn[i] ?? 0,
                    name: nameColumn[i] ?? "uknonwn",
                    value: valueColumn[i] ?? 0.0
                    )

                data.append(row)
            
            }
                      
            error = nil
            
        } catch {
            self.error = error.localizedDescription
            self.data = []
        }
    }
}
