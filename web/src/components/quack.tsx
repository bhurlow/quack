"use client";

import { ConfigProvider, Space, theme } from "antd";
import { QuackProvider, useQuack } from "../provider";
import { SchemaView } from "@/src/components/schema";
import { LLMInput } from "@/src/components/llm-input";
import { SetupCard } from "@/src/components/setup";
import { UploadCard } from "./upload";

const QuackContent = () => {
  const { db, isLoading, isDataLoaded } = useQuack();

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
          {isDataLoaded && <LLMInput />}
        </Space>
      </div>
    </div>
  );
};

export const Quack = () => {
  return (
    <QuackProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
        <QuackContent />
      </ConfigProvider>
    </QuackProvider>
  );
};
