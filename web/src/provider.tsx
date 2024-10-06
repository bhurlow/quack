import React, { createContext, useContext, useState, useEffect } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { initDb } from "@/src/lib/duckdb";

interface QuackContextType {
  db: duckdb.AsyncDuckDB | null;
  conn: duckdb.AsyncDuckDBConnection | null;
  isLoading: boolean;
  isDataLoaded: boolean;
  setIsDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  dataFile: string | undefined;
  setDataFile: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const QuackContext = createContext<QuackContextType | undefined>(undefined);

export const QuackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataFile, setDataFile] = useState<string | undefined>();
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);

  useEffect(() => {
    const loadDb = async () => {
      try {
        const db = await initDb();
        const conn = await db.connect();
        setDb(db);
        setConn(conn);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        setIsLoading(false);
      }
    };

    loadDb();

    return () => {
      console.log("Quack provider teardown");
      conn?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QuackContext.Provider
      value={{
        db,
        conn,
        isLoading,
        isDataLoaded,
        setIsDataLoaded,
        dataFile,
        setDataFile,
      }}
    >
      {children}
    </QuackContext.Provider>
  );
};

export const useQuack = () => {
  const context = useContext(QuackContext);
  if (context === undefined) {
    throw new Error("useQuack must be used within a QuackProvider");
  }
  return context;
};
