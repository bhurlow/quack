import { FC, useState } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";

export interface QueryInputProps {
  db: duckdb.AsyncDuckDB;
}

export const QueryInput: FC<QueryInputProps> = ({ db }) => {
  //
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleQueryChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);
  };

  const executeQuery = async () => {
    try {
      const conn = await db.connect();
      const result = await conn.query(query);
      setResult(result);
      await conn.close();
    } catch (error) {
      console.error("Error executing query:", error);
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      
      <textarea
        value={query}
        onChange={handleQueryChange}
        placeholder="Enter your SQL query here"
        rows={5}
        cols={50}
      />
      <br />
      <button onClick={executeQuery}>Execute Query</button>
      {result && (
        <div>
          <h3>Query Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
