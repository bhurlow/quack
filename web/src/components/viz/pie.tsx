import { FC } from "react";
import { VictoryPie, VictoryLabelProps } from "victory";

export type PieChartData = Array<{
  x: string;
  y: number;
}>;

interface PieChartProps {
  data: PieChartData;
}

// TODO
// having trouble finding how to make these labels fit any size of text
// e.g. "Marketing" needs to fit within the width, could vary on the dataset
const CustomLabel: FC<VictoryLabelProps & { data: PieChartData }> = ({
  x,
  y,
  datum,
  data,
}) => {
  if (!datum || !x || !y) {
    return null;
  }

  const percent = (
    (datum.y / data.reduce((sum, d) => sum + d.y, 0)) *
    100
  ).toFixed(1);
  const labelText = `${datum.x}: ${percent}%`;

  return (
    <g>
      <foreignObject x={x - 50} y={y - 15} width={200} height={30}>
        <div
          style={{
            border: "2x solid white",
            borderWidth: "1px",
            background: "rgba(0, 0, 0, 1)",
            borderRadius: "4px",
            padding: "3px 4px",
            display: "inline-block",
            textAlign: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "12px" }}>{labelText}</span>
        </div>
      </foreignObject>
    </g>
  );
};

export const PieChart: FC<PieChartProps> = ({ data }) => {
  return (
    <VictoryPie
      colorScale={["tomato", "orange", "gold", "cyan", "navy"]}
      data={data}
      style={{
        labels: {
          fill: "white",
        },
      }}
      labelComponent={<CustomLabel data={data} />}
      labels={({ datum }) => {
        const percent = (
          (datum.y / data.reduce((sum, d) => sum + d.y, 0)) *
          100
        ).toFixed(1);
        return `${datum.x}: ${percent}%`;
      }}
    />
  );
};
