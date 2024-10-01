"use client";

import { useState, useEffect, SetStateAction, Dispatch } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";

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
  setSchema: Dispatch<SetStateAction<Record<string, string>>>
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

    // Query the inferred schema
    const schemaQuery = await conn.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_data'
    `);

    // Log the inferred schema
    console.log("Inferred schema:");

    const schemaInfo = schemaQuery.toArray().reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});

    setSchema(schemaInfo);

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

    await conn.close();
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

  const [schema, setSchema] = useState<Record<string, string>>({});
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
    <div>
      <h4>Db Ready</h4>
      <div>{dataFile ? `${dataFile.length} chars` : "No File Selected"}</div>
      <div>
        {!dataFile && (
          <button onClick={() => loadFile(setDataFile)}>Upload CSV</button>
        )}
        {schema && JSON.stringify(schema)}
        {dataFile && (
          <button onClick={() => loadData(db, dataFile, setSchema)}>
            Load Data into DuckDb
          </button>
        )}
      </div>
      <div>
        <button onClick={() => testQuery(db)}>Test Query</button>
      </div>
    </div>
  );
};

// // Select a bundle based on browser checks
// const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

// // Instantiate the asynchronus version of DuckDB-Wasm
// const worker = new Worker(bundle.mainWorker!);

// const logger = new duckdb.ConsoleLogger();

// const db = new duckdb.AsyncDuckDB(logger, worker);

// await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
