import React from "react";

interface ResourceLayerProps {
  stadiumState: any;
}

export const ResourceLayer: React.FC<ResourceLayerProps> = ({
  stadiumState,
}) => {
  const assets = stadiumState?.assets || [];
  return (
    <>
      {assets.map((asset: any) => (
        <g key={asset.id} className="transition-all duration-300">
          <circle
            cx={asset.x}
            cy={asset.y}
            r={14}
            className={`fill-none stroke-2 ${
              asset.type === "medic"
                ? "stroke-red-500"
                : asset.type === "shuttle"
                  ? "stroke-purple-500"
                  : "stroke-blue-500"
            } animate-ping`}
            style={{
              transformOrigin: `${asset.x}px ${asset.y}px`,
            }}
          />
          <circle
            cx={asset.x}
            cy={asset.y}
            r={8}
            className={
              asset.type === "medic"
                ? "fill-red-500"
                : asset.type === "shuttle"
                  ? "fill-purple-500"
                  : "fill-blue-500"
            }
          >
            <animate
              attributeName="cx"
              from="400"
              to={asset.x}
              dur="2s"
              fill="freeze"
            />
            <animate
              attributeName="cy"
              from="210"
              to={asset.y}
              dur="2s"
              fill="freeze"
            />
          </circle>
          <text
            x={asset.x}
            y={asset.y + 3}
            textAnchor="middle"
            className="text-[7px] font-bold fill-white"
          >
            {asset.type === "medic"
              ? "🚑"
              : asset.type === "shuttle"
                ? "🚌"
                : "👮"}
            <animate
              attributeName="x"
              from="400"
              to={asset.x}
              dur="2s"
              fill="freeze"
            />
            <animate
              attributeName="y"
              from="213"
              to={asset.y + 3}
              dur="2s"
              fill="freeze"
            />
          </text>
          <g transform={`translate(${asset.x - 35}, ${asset.y - 28})`}>
            <rect
              rx={4}
              width={70}
              height={15}
              className="fill-slate-950/95 stroke stroke-white/20"
            />
            <text
              x={35}
              y={10}
              textAnchor="middle"
              className="fill-gray-100 font-mono text-[7.5px] font-bold"
            >
              {asset.label} ({asset.status})
            </text>
          </g>
        </g>
      ))}
    </>
  );
};
