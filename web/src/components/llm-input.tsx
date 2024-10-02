import { FC, useState } from "react";
import { getSchema } from "@/src/lib/schema";
import * as duckdb from "@duckdb/duckdb-wasm";
import Anthropic from "@anthropic-ai/sdk";

import { Button, Input, Table } from "antd";

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
): Promise<string> => {
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
    });

    console.log("LLM RES", response);

    // TODO
    // fix type
    const message = response.content[0].text;

    return message;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    throw error;
  }
};

interface LLMInputProps {
  db: duckdb.AsyncDuckDB;
  generateSqlQuery: (prompt: string) => Promise<string>;
}

export const LLMInput: FC<LLMInputProps> = ({ db }) => {
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [queryResult, setQueryResult] = useState<duckdb.AsyncResult | null>(
    null
  );

  const handleGenerateQuery = async () => {
    try {
      const query = await generateSqlQuery(db, userPrompt);
      setGeneratedQuery(query);
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

    const columns = firstBatch.schema.fields.map((field) => field.name);
    const rows = firstBatch
      .toArray()
      .map((row) => columns.map((col) => row[col as keyof typeof row]));

    return (
      <div>
        <h4>Query Result:</h4>
        <Table
          dataSource={rows.map((row, index) => ({
            key: index,
            ...Object.fromEntries(columns.map((col, i) => [col, row[i]])),
          }))}
          columns={columns.map((col) => ({
            title: col,
            dataIndex: col,
            key: col,
            render: (text: any) => String(text),
          }))}
          pagination={false}
        />
      </div>
    );
  };

  return (
    <div>
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
    </div>
  );
};
