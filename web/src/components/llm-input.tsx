import { FC, useState } from "react";
import * as arrow from "apache-arrow";
import { Button, Input, Table, Space, Card, message } from "antd";

import { getSchema } from "@/src/lib/schema";
import { useQuack } from "@/src/provider";
import { generateQuery } from "@/app/actions/generate";
import { PieChartData, PieChart } from "@/src/components/viz/pie";
import {
  TimeSeriesData,
  TimeSeriesChart,
} from "@/src/components/viz/timeseries";

const { TextArea } = Input;

type DuckDBValue = string | number | boolean | Date | Uint8Array | null;

export const LLMInput: FC = () => {
  const { conn } = useQuack();
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [queryResult, setQueryResult] = useState<arrow.Table | null>(null);

  const [pieChartData, setPieChartData] = useState<PieChartData | undefined>();
  const [timeSeriesData, setTimeSeriesData] = useState<
    TimeSeriesData | undefined
  >();

  const handleGenerateQuery = async () => {
    if (!conn) {
      throw new Error("no conn");
    }

    setIsGenerating(true);
    const schema = await getSchema(conn);

    try {
      const llmRes = await generateQuery(userPrompt, schema);

      console.log("Response from generateQuery server action:", llmRes);

      if (typeof llmRes === "object" && llmRes !== null) {
        // Handle the object case
        console.log("LLM response is an object:", llmRes);

        if (llmRes.name === "exec_query") {
          setGeneratedQuery(llmRes.input.query);
        }

        if (llmRes.name === "create_pie_chart") {
          const input = llmRes.input;
          const result = await conn.query(input.query);

          const fieldName = input.field;
          const valueName = input.value;

          if (result && result.batches.length > 0) {
            let allData: arrow.StructRowProxy[] = [];
            for (const batch of result.batches) {
              allData = allData.concat(batch.toArray());
            }
            const chartData = allData.map((row) => ({
              x: String(row[fieldName]),
              y: Number(row[valueName]),
            }));

            if (chartData.length) {
              setPieChartData(chartData);
            }
          }
        }

        if (llmRes.name === "create_timeseries") {
          const input = llmRes.input;
          const result = await conn.query(input.query);

          const dateFieldName = input.field;
          const valueFieldName = input.value;

          console.log("TIME SERIES LLM", llmRes, result);
          // const fieldName = input.field;
          // const valueName = input.value;

          if (result && result.batches.length > 0) {
            let allData: arrow.StructRowProxy[] = [];
            for (const batch of result.batches) {
              allData = allData.concat(batch.toArray());
            }

            // Map the query result to the TimeSeriesData format
            const chartData = allData.map((row) => ({
              x: new Date(row[dateFieldName]), // Convert to Date object
              y: Number(row[valueFieldName]),
            }));

            if (chartData.length) {
              setTimeSeriesData(chartData);
            }
          }
        }
      } else {
        // Handle the non-object case
        setGeneratedQuery(llmRes);
      }
    } catch (error) {
      console.error("Error generating query:", error);
      message.error("Failed to load data. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunQuery = async () => {
    if (!conn) {
      throw new Error("no conn");
    }

    try {
      const result = await conn.query(generatedQuery);
      console.log("query result", result);
      setQueryResult(result);
      await conn.close();
    } catch (error) {
      console.error("Error running query:", error);
    }
  };

  const renderQueryResult = () => {
    if (!queryResult) return null;

    const firstBatch = queryResult.batches[0];
    if (!firstBatch) return <p>No results to display.</p>;

    const columns = firstBatch.schema.fields.map((field) => ({
      name: field.name,
      type: field.type,
    }));

    const rows = firstBatch.toArray();

    return (
      <div>
        <h4>Query Result:</h4>
        <Table
          dataSource={rows.map((row, index) => ({
            key: index,
            ...Object.fromEntries(
              columns.map((col) => [col.name, row[col.name]])
            ),
          }))}
          columns={columns.map((col) => ({
            title: col.name,
            dataIndex: col.name,
            key: col.name,
            render: (value: DuckDBValue) => renderValue(value, col.type),
          }))}
          pagination={false}
        />
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderValue = (value: DuckDBValue, type: any): string => {
    console.log("render type", type);
    if (value === null) return "NULL";
    return String(value);
    // switch (type) {
    //   case DataType.Date:
    //   case DataType.Time:
    //   case DataType.Timestamp:
    //   case DataType.TimestampTZ:
    //     return value.toISOString();
    //   case DataType.Blob:
    //     return "<BLOB>";
    //   default:
    //     return String(value);
    // }
  };

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <div>
          <TextArea
            rows={4}
            placeholder="Describe the query you want to generate..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />
          <Button
            type="primary"
            onClick={handleGenerateQuery}
            loading={isGenerating}
          >
            Generate Query
          </Button>
        </div>
        <div>
          <TextArea
            rows={4}
            value={generatedQuery}
            onChange={(e) => setGeneratedQuery(e.target.value)}
            placeholder="Generated SQL query will appear here"
          />
          <Button type="primary" onClick={handleRunQuery}>
            Run Query
          </Button>
        </div>
        {queryResult && renderQueryResult()}
        {pieChartData && (
          <Card title="Data" bordered={true} color="blue" className="bg-blue">
            <div style={{ height: 400, position: "relative" }}>
              <PieChart data={pieChartData} />
            </div>
          </Card>
        )}
        {timeSeriesData && (
          <Card title="Data" bordered={true} color="blue" className="bg-blue">
            <div style={{ height: 400, position: "relative" }}>
              <TimeSeriesChart data={timeSeriesData} />
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};
