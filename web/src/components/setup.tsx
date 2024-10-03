import * as duckdb from "@duckdb/duckdb-wasm";
import { FC, useEffect, useState } from "react";
import { Card } from "antd";

export interface SchemaViewProps {
  db: duckdb.AsyncDuckDB;
}

export const SetupCard: FC<SchemaViewProps> = ({ db }) => {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    const fetchVersion = async () => {
      const dbVersion = await db.getVersion();
      setVersion(dbVersion);
    };

    fetchVersion();
  }, [db]);

  return (
    <Card title="Setup" bordered={true} style={{ width: 800 }}>
      <h3>Using DuckDB Version {version}</h3>
    </Card>
  );
};
