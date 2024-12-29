import SwiftUI
import TabularData

struct ContentView: View {
    
    @StateObject private var dbManager = DatabaseManager()
    
    @State private var queryInput: String = "SELECT * FROM sample_data"
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                TextField("Enter SQL query", text: $queryInput)
                    .textFieldStyle(.roundedBorder)
                
                Button("Execute") {
                    dbManager.executeQuery(queryInput)
                }
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding()
            
            if let error = dbManager.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
            
            Table(dbManager.data) {
                
                TableColumn("id") { (row: Row) in
                    Text(String(row.id))
                }
                
                TableColumn("name", value: \.name)
                
                TableColumn("value") { (row: Row) in
                    Text(String(row.value))
                }
           
            }
        }
        .frame(minWidth: 600, minHeight: 400)
        .onAppear {
            dbManager.executeQuery(queryInput)
        }
    }
}

#Preview {
    ContentView()
}
