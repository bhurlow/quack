"use client";

import { ConfigProvider, Space, theme } from "antd";
import { DuckProvider, useDuck } from "../provider";
import { SchemaView } from "@/src/components/schema";
import { LLMInput } from "@/src/components/llm-input";
import { SetupCard } from "@/src/components/setup";
import { UploadCard } from "./upload";

const DuckContent = () => {
  const { db, isLoading, isDataLoaded } = useDuck();

  if (isLoading || !db) {
    return <h1 className="red text-lg"> 🦆 Loading Quack... </h1>;
  }

  return (
    <div>
      <div>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <SetupCard db={db} />
          <UploadCard />
          {isDataLoaded && <SchemaView db={db} />}
          {isDataLoaded && <LLMInput db={db} />}
        </Space>
      </div>
    </div>
  );
};

export const Duck = () => {
  return (
    <DuckProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
        <DuckContent />
      </ConfigProvider>
    </DuckProvider>
  );
};
