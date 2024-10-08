import Anthropic from "@anthropic-ai/sdk";

export type QueryInput = {
  query: string;
};

export type VizInput = {
  field: string;
  query: string;
  value: string;
};

export type ExecQueryResult = {
  name: "exec_query";
  input: QueryInput;
};

export type CreatePieChartResult = {
  name: "create_pie_chart";
  input: VizInput;
};

export type CreateTimeSeriesResult = {
  name: "create_timeseries";
  input: VizInput;
};

export type ToolResult =
  | ExecQueryResult
  | CreatePieChartResult
  | CreateTimeSeriesResult;

export type LLMInput = QueryInput | VizInput;

export type VizToolUseBlock = Anthropic.Messages.ToolUseBlock & {
  input: LLMInput;
};
