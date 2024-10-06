import { FC, useState } from "react";
import { getSchema } from "@/src/lib/schema";
import { useQuack } from "@/src/provider";
import * as arrow from "apache-arrow";
import * as duckdb from "@duckdb/duckdb-wasm";
import Anthropic from "@anthropic-ai/sdk";
import { Card } from "antd";
import { VictoryPie } from "victory";

import { Button, Input, Table, Space } from "antd";

const { TextArea } = Input;

// TODO
// we plan to move this to the API to at least not leak keys
const anthropic = new Anthropic({
  dangerouslyAllowBrowser: true,
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

type DuckDBValue = string | number | boolean | Date | Uint8Array | null;

type VizInput = {
  field: string;
  query: string;
  value: string;
};

type QueryInput = {
  query: string;
};

type LLMInput = QueryInput | VizInput;

type VizToolUseBlock = Anthropic.Messages.ToolUseBlock & {
  input: LLMInput;
};

const systemPrompt = (schema: string) => `
You are embedded in a data tool which has an instance of DuckDB loaded with the following data schema:

${schema}

All queries should be run for the table named: "user_data"

Generate SQL queries based on your input which may be executed on the DuckDB instance. 

Respond with only the SQL query text itself. The result of request should always be valid SQL text only. 
`;

const generateSqlQuery = async (
  conn: duckdb.AsyncDuckDBConnection,
  prompt: string
): Promise<string | VizToolUseBlock> => {
  const schema = await getSchema(conn);

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      system: systemPrompt(JSON.stringify(schema)),
      messages: [
        {
          role: "user",
          content: `Generate a SQL query for the following request: ${prompt}`,
        },
      ],
      tools: [
        {
          name: "exec_query",
          description:
            "Execute the generated SQL query string and show the results to the user",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "the raw text of the SQL query generated in the above prompt",
              },
            },
          },
        },
        {
          name: "create_pie_chart",
          description:
            "Create a Pie chart visualization from the result of the generated SQL Query",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "the raw text of the SQL query generated in the above prompt",
              },
              field: {
                type: "string",
                description: "field name for each pie chart slice",
              },
              value: {
                type: "string",
                description: "the numeric value of the slice",
              },
            },
          },
        },
      ],
    });

    console.log("LLM RES", response);

    // TODO
    // need to declare the response type based on the data type here
    // to satisy unknowns in the input API

    const contents = response.content;

    const toolRes = contents.find((x) => x.type === "tool_use");

    if (toolRes) {
      return toolRes as VizToolUseBlock;
    }

    const content = response.content[0];

    if (content.type === "text") {
      return content.text;
    }

    throw new Error("Unexpected result from LLM call");
  } catch (error) {
    console.error("Error generating SQL query:", error);
    throw error;
  }
};

// interface LLMInputProps {
//   db: duckdb.AsyncDuckDB;
// }

type PieChartData = Array<{
  x: string;
  y: number;
}>;

// const fn = (): PieChartData => {
//   return [{x: 'foo', y: 90}]
// }

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

    try {
      // TODO
      // rename
      const llmRes = await generateSqlQuery(conn, userPrompt);

      if (typeof llmRes === "object" && llmRes !== null) {
        // Handle the object case
        console.log("LLM response is an object:", llmRes);

        if (llmRes.name === "exec_query") {
          setGeneratedQuery(llmRes.input.query);
        }

        if (llmRes.name === "create_pie_chart") {
          // const query = llmRes.input.query;
          const result = await conn.query(llmRes.input.query);
          const fieldName = llmRes.input.field;
          const valueName = llmRes.input.value;

          if (result && result.batches.length > 0) {
            let allData: any[] = [];
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
