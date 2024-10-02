import * as duckdb from "@duckdb/duckdb-wasm";

export const getSchema = async (conn: duckdb.AsyncDuckDBConnection) => {
  const schemaQuery = await conn.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_data'
  `);

  return schemaQuery.toArray().map((row) => ({
    columnName: row.column_name,
    dataType: row.data_type,
  }));
};
