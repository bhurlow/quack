"use server";

// import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { Schema } from "@/src/lib/schema";
import { VizToolUseBlock } from "@/src/llm/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = (schema: string) => `
You are embedded in a data tool which has an instance of DuckDB loaded with the following data schema:

${schema}

All queries should be run for the table named: "user_data"

Generate SQL queries based on your input which may be executed on the DuckDB instance. 

Respond with only the SQL query text itself. The result of request should always be valid SQL text only. 
`;

export async function generateQuery(prompt: string, schema: Schema) {
  console.log("GENERATE QUERY ACTION ----->", prompt, schema);

  // TODO
  // do i need this?
  // revalidatePath("/path-to-revalidate");

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
}
