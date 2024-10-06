import Anthropic from "@anthropic-ai/sdk";

export type VizInput = {
  field: string;
  query: string;
  value: string;
};

export type QueryInput = {
  query: string;
};

export type LLMInput = QueryInput | VizInput;

export type VizToolUseBlock = Anthropic.Messages.ToolUseBlock & {
  input: LLMInput;
};
