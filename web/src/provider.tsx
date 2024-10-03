import React, { createContext, useContext, useState, useEffect } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { initDb } from "@/src/lib/duckdb"; // You'll need to move initDb to a separate file

interface DuckContextType {
  db: duckdb.AsyncDuckDB | null;
  isLoading: boolean;
  isDataLoaded: boolean;
  setIsDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  dataFile: string | undefined;
  setDataFile: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const DuckContext = createContext<DuckContextType | undefined>(undefined);

export const DuckProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  return (
    <DuckContext.Provider
      value={{
        db,
        isLoading,
        isDataLoaded,
        setIsDataLoaded,
        dataFile,
        setDataFile,
      }}
    >
      {children}
    </DuckContext.Provider>
  );
};

export const useDuck = () => {
  const context = useContext(DuckContext);
  if (context === undefined) {
    throw new Error("useDuck must be used within a DuckProvider");
  }
  return context;
};
