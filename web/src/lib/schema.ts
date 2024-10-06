import * as duckdb from "@duckdb/duckdb-wasm";

export type Schema = {
  columnName: string;
  dataType: string;
}[];

export const getSchema = async (
  conn: duckdb.AsyncDuckDBConnection
): Promise<Schema> => {
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
