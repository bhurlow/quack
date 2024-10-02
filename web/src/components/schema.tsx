import * as duckdb from "@duckdb/duckdb-wasm";
import { FC, useEffect, useState } from "react";

// // Query the inferred schema

// // Log the inferred schema
// console.log("Inferred schema:");

// setSchema(schemaInfo);

// console.log("Schema info object:", schemaInfo);
// You can now use this schemaInfo object to set state
// For example: setSchema(schemaInfo);
// schemaQuery.toArray().forEach((row) => {
// console.log(`${row.column_name}: ${row.data_type}`);
// });

// Optionally, you can store the schema information in state if you want to display it in the UI
// const schemaInfo = schemaQuery.toArray().map(row => ({
//   columnName: row.column_name,
//   dataType: row.data_type
// }));
// setSchema(schemaInfo); // You would need to add a new state variable for this

// const [schema, setSchema] = useState<Record<string, string>>({});

import { Table } from "antd";

export interface SchemaViewProps {
  db: duckdb.AsyncDuckDB;
}

export const SchemaView: FC<SchemaViewProps> = ({ db }) => {
  const [schemaData, setSchemaData] = useState<
    Array<{ columnName: string; dataType: string }>
  >([]);

  useEffect(() => {
    const fetchSchema = async () => {
      console.log("load schema");
      const conn = await db.connect();

      const schemaQuery = await conn.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_data'
      `);

      const schemaInfo = schemaQuery.toArray().map((row) => ({
        columnName: row.column_name,
        dataType: row.data_type,
      }));

      setSchemaData(schemaInfo);
      console.log("schema info", schemaInfo);
    };

    fetchSchema().catch(console.error);
  }, [db]);

  const columns = [
    {
      title: "Name",
      dataIndex: "columnName",
      key: "columnName",
    },
    {
      title: "Type",
      dataIndex: "dataType",
      key: "dataType",
    },
  ];

  return (
    <div>
      <h3>Schema Data</h3>
      {schemaData.length ? (
        // <div>schema</div>
        <Table
          dataSource={schemaData}
          bordered={true}
          columns={columns}
          size={"small"}
          pagination={false}
          footer={() => "Hello"}
        />
      ) : (
        <div> loading </div>
      )}
    </div>
  );
};
