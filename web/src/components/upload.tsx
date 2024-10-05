import * as duckdb from "@duckdb/duckdb-wasm";
import { useQuack } from "@/src/provider";
import { FC, Dispatch, SetStateAction } from "react";
import { Button, Card, message } from "antd";
import { CheckCircle } from "lucide-react";

const loadDataIntoDuckDB = async (
  db: duckdb.AsyncDuckDB,
  csvContent: string,
  setIsDataLoaded: Dispatch<SetStateAction<boolean>>
) => {
  try {
    await db.registerFileText("data.csv", csvContent);
    const conn = await db.connect();

    await conn.insertCSVFromPath("data.csv", {
      schema: "main",
      name: "user_data",
      detect: true,
      header: true,
      delimiter: ",",
    });

    console.log("Data loaded successfully");
    await conn.close();
    setIsDataLoaded(true);
    message.success("Data loaded successfully");
  } catch (error) {
    console.error("Error loading data:", error);
    message.error("Failed to load data. Please try again.");
    throw error;
  }
};

const handleFileUpload = async (
  db: duckdb.AsyncDuckDB | null,
  setDataFile: Dispatch<SetStateAction<string | undefined>>,
  setIsDataLoaded: Dispatch<SetStateAction<boolean>>
) => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const result = e.target?.result;

      if (typeof result === "string" && db) {
        try {
          await loadDataIntoDuckDB(db, result, setIsDataLoaded);
          setDataFile(result);
        } catch (error) {
          console.error("Error processing file:", error);
          setDataFile(undefined);
          setIsDataLoaded(false);
        }
      } else {
        console.error("File content is not a string or DB is not initialized");
        message.error("Invalid file content or database not initialized");
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
};

export const UploadCard: FC = () => {
  const { db, isLoading, setIsDataLoaded, dataFile, setDataFile } = useQuack();

  return (
    <Card title="Data" bordered={true} style={{ width: 800 }}>
      <div>
        {!dataFile ? (
          <Button
            onClick={() => handleFileUpload(db, setDataFile, setIsDataLoaded)}
            disabled={isLoading}
          >
            Upload and Process CSV
          </Button>
        ) : (
          <div>
            <p>
              <span>
                <CheckCircle color="green" size={18} />
                Data Loaded
              </span>
            </p>
            {dataFile ? `${dataFile.length} chars` : "No File Selected"}
          </div>
        )}
      </div>
    </Card>
  );
};
