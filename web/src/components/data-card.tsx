import React, { FC, ReactNode, useState } from "react";
import { Card, CardProps } from "antd";
import { Ellipsis } from "lucide-react";

import type { MenuProps } from "antd";
import { Dropdown, Space } from "antd";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface DataCardProps extends Omit<CardProps, "title"> {
  title?: ReactNode;
  onButtonClick?: () => void;
  children: ReactNode;
  query: string;
}

export const DataCard: FC<DataCardProps> = ({
  title = "Data",
  query = "",
  children,
  ...cardProps
}) => {
  const [showQuery, setShowQuery] = useState(false);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.antgroup.com"
          onClick={(e) => {
            e.preventDefault();
            setShowQuery(true);
          }}
        >
          Show Query
        </a>
      ),
    },
    {
      key: "2",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.antgroup.com"
          onClick={(e) => {
            e.preventDefault();
            setShowQuery(false);
          }}
        >
          Show Chart
        </a>
      ),
    },
  ];

  return (
    <Card
      title={title}
      bordered={true}
      extra={
        <Dropdown menu={{ items }} placement="bottom">
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <Ellipsis />
            </Space>
          </a>
        </Dropdown>
      }
      {...cardProps}
    >
      {showQuery ? (
        <div>
          <SyntaxHighlighter
            language="sql"
            style={dark}
            customStyle={{
              boxShadow: "none",
              border: "none",
              background: "transparent",
              padding: "1em",
              maxHeight: "300px",
              overflowY: "auto",
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
              },
            }}
          >
            {query}
          </SyntaxHighlighter>
        </div>
      ) : (
        children
      )}
    </Card>
  );
};

export default DataCard;
