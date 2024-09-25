"use client";

import { useState, useEffect } from "react";
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

const loadData = async (db: duckdb.AsyncDuckDB) => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;

      try {
        await db.registerFileText(`data.csv`, csvContent);
        const conn = await db.connect();

        await conn.insertCSVFromPath("data.csv", {
          schema: "main",
          name: "user_data",
          detect: false,
          header: false,
          delimiter: ",",
          columns: {
            // Adjust these column names and types according to your actual data structure
            // big question is how to extract this from the csv data
            ID: new arrow.Utf8(),
            Name: new arrow.Utf8(),
            Age: new arrow.Utf8(),
            Salary: new arrow.Utf8(),
            Department: new arrow.Utf8(),

            // Add more columns as needed
          },
        });

        console.log("Data loaded successfully");
        await conn.close();
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
};

const testQuery = async (db: duckdb.AsyncDuckDB) => {
  const conn = await db.connect();

  const res = await conn.query<{ Name: arrow.Utf8; Age: arrow.Utf8 }>(`
    SELECT (Name, Age) FROM user_data
`);

  const ageData = [];

  // const rowCount = res.numRows;
  
  const nameColumn = res.getChildAt(0);

  const entries = nameColumn.toArray().entries()

  for (const entry in entries) {
    console.log(entry)
  }

  // const ageColumn = res.getChildAt(1);

  // for (const [index] of nameColumn.toArray().entries()) {
  //   const name = nameColumn.get(index);
  //   const age = ageColumn.get(index);
  //   ageData.push({ name, age });
  // }

  // for (const batch of res.batches) {
  //   console.log("batch", batch);
  //   for (const column of batch.getChildAt(0)) {
  //     const rowData = column.toJSON();

  //     ageData.push(rowData);
  //     // if (rowData && rowData.length === 2) {
  //     // ageData.push({ name: rowData[0], age: rowData[1] });
  //     // }
  //   }
  // }

  // console.log("Extracted Age data:", ageData);

  // for (const batch of res.batches) {
  //   console.log("query res", batch);
  // }
};

export const Duck = () => {
  const [isLoading, setIsLoading] = useState(true);
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
      <button onClick={() => loadData(db)}>Load Data</button>
      <button onClick={() => testQuery(db)}>Test Query</button>
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
