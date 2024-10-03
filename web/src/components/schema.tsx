import * as duckdb from "@duckdb/duckdb-wasm";
import { FC, useEffect, useState } from "react";
import { getSchema } from "@/src/lib/schema";
import { Card, Table } from "antd";

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
      const schemaInfo = await getSchema(conn);
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
    <Card title="Your Schema" bordered={true} style={{ width: 800 }}>
      <div>
        {schemaData.length ? (
          <Table
            dataSource={schemaData}
            bordered={true}
            columns={columns}
            size={"small"}
            pagination={false}
          />
        ) : (
          <div> loading </div>
        )}
      </div>
    </Card>
  );
};
