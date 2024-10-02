"use client";

// ConfigProvider
import { Button, ConfigProvider, Input, Space, theme } from "antd";

import { useState, useEffect, SetStateAction, Dispatch } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";

import { SchemaView } from "@/src/components/schema";
import { QueryInput } from "@/src/components/query-input";
import { LLMInput } from "@/src/components/llm-input";

// @ts-expect-error can't import
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm";

// @ts-expect-error can't import
import duckdb_wasm_next from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: new URL(
      "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js",
      import.meta.url
    ).toString(),
  },
  eh: {
    mainModule: duckdb_wasm_next,
    mainWorker: new URL(
      "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js",
      import.meta.url
    ).toString(),
  },
};

const initDb = async () => {
  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  // Instantiate the asynchronous version of DuckDB-Wasm
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
};

const loadFile = (
  setDataFile: Dispatch<SetStateAction<string | undefined>>
) => {
  // TODO
  // idk why claude made me add this file to the dom
  // should be able to use an input instead
  const fileInput = document.createElement("input");

  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const result = e.target?.result;

      if (typeof result === "string") {
        const csvContent = result;
        setDataFile(csvContent);
      } else {
        console.error("File content is not a string");
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
};

const loadData = async (
  db: duckdb.AsyncDuckDB,
  dataFile: string,
  setIsDataLoaded: Dispatch<SetStateAction<boolean>>
) => {
  try {
    // TODO
    // fix coerce
    await db.registerFileText(`data.csv`, dataFile as string);
    const conn = await db.connect();

    await conn.insertCSVFromPath("data.csv", {
      schema: "main",
      name: "user_data",
      // AutoDetect appears to work pretty well
      // I was initially considering prompting user to decide per-column
      detect: true,
      header: true,
      delimiter: ",",

      // columns: {
      //   ID: new arrow.Utf8(),
      //   Name: new arrow.Utf8(),
      //   Age: new arrow.Utf8(),
      //   Salary: new arrow.Utf8(),
      //   Department: new arrow.Utf8(),
      // },
    });

    console.log("Data loaded successfully");
    await conn.close();
    setIsDataLoaded(true);
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

const testQuery = async (db: duckdb.AsyncDuckDB) => {
  const conn = await db.connect();

  const res = await conn.query<{ Name: arrow.Utf8; Age: arrow.Utf8 }>(`
    SELECT (Name, Age) FROM user_data
`);

  console.log("query res", res);
};

export const Duck = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataFile, setDataFile] = useState<string | undefined>();
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);

  useEffect(() => {
    const loadDb = async () => {
      try {
        const duckDb = await initDb();
        setDb(duckDb);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        setIsLoading(false);
      }
    };

    loadDb();
  }, []);

  if (isLoading || !db) {
    return <h3>Loading DuckDB...</h3>;
  }

  return (
    <ConfigProvider
      theme={{
        // 1. Use dark algorithm
        algorithm: theme.darkAlgorithm,

        // 2. Combine dark algorithm and compact algorithm
        // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }}
    >
      <div>
        <h4>Db Ready</h4>
        <div>{dataFile ? `${dataFile.length} chars` : "No File Selected"}</div>
        <div>
          {!dataFile && (
            <button onClick={() => loadFile(setDataFile)}>Upload CSV</button>
          )}

          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            {isDataLoaded && <SchemaView db={db} />}
            {/* {isDataLoaded && <QueryInput db={db} />} */}
            {isDataLoaded && <LLMInput db={db} />}
            {dataFile && (
              <button onClick={() => loadData(db, dataFile, setIsDataLoaded)}>
                Load Data into DuckDb
              </button>
            )}
          </Space>
        </div>
        <div>
          <button onClick={() => testQuery(db)}>Test Query</button>
        </div>
      </div>
    </ConfigProvider>
  );
};
