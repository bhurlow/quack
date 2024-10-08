"use server";

// import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { Schema } from "@/src/lib/schema";
import { VizInput, QueryInput, ToolResult } from "@/src/llm/types";

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

const ExecInput: Anthropic.Messages.Tool = {
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
};

const PieChartInput: Anthropic.Messages.Tool = {
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
};

const TimeSeriesInput: Anthropic.Messages.Tool = {
  name: "create_timeseries",
  description:
    "Create a Timeseries chart visualization from the result of the generated SQL Query. Assume the x axis is a time field and the user may specify how the time values should be bucketed",
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
        description:
          "The x axis value of the time series, should be time related",
      },
      value: {
        type: "string",
        description: "The y axis value of the time series",
      },
    },
  },
};

export async function generateQuery(
  prompt: string,
  schema: Schema
): Promise<ToolResult> {
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
    tools: [ExecInput, PieChartInput, TimeSeriesInput],
  });

  console.log("LLM RES", response);

  const contents = response.content;

  const toolRes = contents.find((x) => x.type === "tool_use");

  if (toolRes) {
    if (toolRes.name === "exec_query") {
      return {
        name: "exec_query",
        input: toolRes.input as QueryInput,
      };
    }
    if (toolRes.name === "create_pie_chart") {
      return {
        name: "create_pie_chart",
        input: toolRes.input as VizInput,
      };
    }
    if (toolRes.name === "create_timeseries") {
      return {
        name: "create_timeseries",
        input: toolRes.input as VizInput,
      };
    }
  }

  throw new Error("Unexpected result from LLM call");
}
