import { FC } from "react";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  // VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLabelProps,
} from "victory";

export type TimeSeriesData = Array<{
  x: Date;
  y: number;
}>;

interface TimeSeriesChartProps {
  data: TimeSeriesData;
}

// TODO
const CustomTooltip: FC<VictoryLabelProps & { data: TimeSeriesData }> = ({
  x,
  y,
  datum,
}) => {
  if (!datum || !x || !y) {
    return null;
  }

  return (
    <g>
      <foreignObject x={datum.x - 75} y={datum.y - 40} width={150} height={40}>
        <div
          style={{
            border: "2px solid white",
            background: "rgba(0, 0, 0, 0.8)",
            borderRadius: "4px",
            padding: "4px 6px",
            textAlign: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "12px" }}>
            {`${datum.x.toLocaleDateString()}: ${datum.y}`}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};

export const TimeSeriesChart: FC<TimeSeriesChartProps> = ({ data }) => {
  return (
    <VictoryChart
      containerComponent={
        <VictoryVoronoiContainer
          voronoiDimension="x"
          labels={({ datum }) => `${datum.x.toLocaleDateString()}: ${datum.y}`}
          labelComponent={<CustomTooltip data={data} />}
        />
      }
    >
      <VictoryAxis
        tickFormat={(x) => new Date(x).toLocaleDateString()}
        style={{
          tickLabels: { fill: "white", fontSize: 10 },
          axis: { stroke: "white" },
        }}
      />
      <VictoryAxis
        dependentAxis
        style={{
          tickLabels: { fill: "white", fontSize: 10 },
          axis: { stroke: "white" },
        }}
      />
      <VictoryLine
        data={data}
        style={{
          data: { stroke: "cyan" },
        }}
      />
    </VictoryChart>
  );
};
