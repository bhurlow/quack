import { FC, useState } from "react";
import { getSchema } from "@/src/lib/schema";
import { useQuack } from "@/src/provider";
import * as arrow from "apache-arrow";
import { Card } from "antd";
import { VictoryPie } from "victory";
import { generateQuery } from "@/app/actions/generate";
import { VizInput } from "@/src/llm/types";

import { Button, Input, Table, Space } from "antd";

const { TextArea } = Input;

type DuckDBValue = string | number | boolean | Date | Uint8Array | null;

type PieChartData = Array<{
  x: string;
  y: number;
}>;

export const LLMInput: FC = () => {
  const { conn } = useQuack();
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [queryResult, setQueryResult] = useState<arrow.Table | null>(null);

  // TODO
  // need to specify a union of possible visualization types
  const [pieChartData, setPieChartData] = useState<PieChartData | undefined>();

  const handleGenerateQuery = async () => {
    if (!conn) {
      throw new Error("no conn");
    }

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
          // TODO
          // fix this type issue in the return result union
          const input = llmRes.input as VizInput;

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
      } else {
        // Handle the non-object case
        setGeneratedQuery(llmRes);
      }
    } catch (error) {
      console.error("Error generating query:", error);
    }
  };

  const handleRunQuery = async () => {
    if (!conn) {
      throw new Error("no conn");
    }

    try {
      // const conn = await db.connect();
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
          <Button type="primary" onClick={handleGenerateQuery}>
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
              <VictoryPie
                colorScale={["tomato", "orange", "gold", "cyan", "navy"]}
                data={pieChartData}
              />
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};
