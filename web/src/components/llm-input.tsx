import { FC, useState } from "react";
import { getSchema } from "@/src/lib/schema";
import * as arrow from "apache-arrow";
import * as duckdb from "@duckdb/duckdb-wasm";
import Anthropic from "@anthropic-ai/sdk";

import { Button, Input, Table, Space } from "antd";

const { TextArea } = Input;

const anthropic = new Anthropic({
  dangerouslyAllowBrowser: true,
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

const systemPrompt = (schema: string) => `
You are embedded in a data tool which has an instance of DuckDB loaded with the following data schema:

${schema}

All queries should be run for the table named: "user_data"

Generate SQL queries based on your input which may be executed on the DuckDB instance. 

Respond with only the SQL query text itself. The result of request should always be valid SQL text only. 
`;

const generateSqlQuery = async (
  db: duckdb.AsyncDuckDB,
  prompt: string
): Promise<string | Anthropic.Messages.ToolUseBlock> => {
  const conn = await db.connect();
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

    const contents = response.content;

    const toolRes = contents.find((x) => x.type === "tool_use");

    if (toolRes) {
      return toolRes;
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

interface LLMInputProps {
  db: duckdb.AsyncDuckDB;
}

type DuckDBValue = string | number | boolean | Date | Uint8Array | null;

export const LLMInput: FC<LLMInputProps> = ({ db }) => {
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [queryResult, setQueryResult] = useState<arrow.Table | null>(null);

  const [visualization, setVisualization] = useState<
    Anthropic.Messages.ToolUseBlock | undefined
  >();

  const handleGenerateQuery = async () => {
    try {
      // TODO
      // rename
      const llmRes = await generateSqlQuery(db, userPrompt);

      if (typeof llmRes === "object" && llmRes !== null) {
        // Handle the object case
        console.log("LLM response is an object:", llmRes);
        if (llmRes.name === "create_pie_chart") {
          setVisualization(llmRes);
        }

        // You might want to add more specific handling here
        // depending on the expected structure of the object
      } else {
        // Handle the non-object case (likely a string)
        setGeneratedQuery(llmRes);
      }
    } catch (error) {
      console.error("Error generating query:", error);
    }
  };

  const handleRunQuery = async () => {
    try {
      const conn = await db.connect();
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
        {/* Here we'll take the tool settings and invoke the query with the visual result */}
        {visualization && <p>{JSON.stringify(visualization)}</p>}
        {queryResult && renderQueryResult()}
      </Space>
    </div>
  );
};
