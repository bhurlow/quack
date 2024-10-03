import * as duckdb from "@duckdb/duckdb-wasm";

// const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// // @ts-expect-error can't import
// import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm";
// // @ts-expect-error can't import
// import duckdb_wasm_next from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm";

// const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
//   mvp: {
//     mainModule: duckdb_wasm,
//     mainWorker: new URL(
//       "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js",
//       import.meta.url
//     ).toString(),
//   },
//   eh: {
//     mainModule: duckdb_wasm_next,
//     mainWorker: new URL(
//       "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js",
//       import.meta.url
//     ).toString(),
//   },
// };

export const initDb = async () => {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    })
  );

  // Select a bundle based on browser checks
  // const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  // Instantiate the asynchronous version of DuckDB-Wasm
  // const worker = new Worker(bundle.mainWorker!);

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
};
