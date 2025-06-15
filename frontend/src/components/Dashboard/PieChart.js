import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./Dashboard.css"; // ✅ External CSS

const marketGradients = {
  Bullish: ["#8EE4AF"],
  Bearish: ["#FF6F61"],
  "Nifty Prediction": ["#74A9D8"],
  "Bank Nifty Prediction": ["#FFAD60"],
};
console.warn = () => {};
// ✅ Custom Tooltip Component with Higher Z-Index
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const bidName = payload[0].name;
    const totalAvailableCount = payload[0].value;
    const color = marketGradients[bidName] || ["#007bff"];

    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{bidName}</p>
        <div className="tooltip-item">
          <span
            className="tooltip-color-box"
            style={{ background: color[0] }}
          ></span>
          <span
            className="tooltip-text"
            style={{
              background: color[0],
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {bidName}: {totalAvailableCount}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const BidPieChart = ({ bidName, bidSlots, totalAvailableCount, completedBids, percentage, marketName }) => {

  // 🎨 Get Colors
  const filledColor = marketGradients[marketName] ? marketGradients[marketName][0] : "#007bff";
  const remainingColor = "#E0E0E0"; // ✅ Fixed Remaining Color
  
  const data = [
    { name: "Completed", value: completedBids, color: filledColor }, // ✅ Filled Progress
    { name: "Remaining", value: totalAvailableCount, color: remainingColor }, // ✅ Empty Part
  ];

  return (
    <div className="pie-chart-card">
      <div className="pie-chart-header">
        <div className="header-lines">
          <div className={`small-line ${marketName}`}></div>
          <div className={`long-line ${marketName}`}></div>
        </div>
        <h4 className={`pie-header ${marketName}`}>Bid: {bidName}</h4>
      </div>
      
      <div className="pie-chart-container">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            {/* Pie Chart with Only Two Colors */}
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={65}
              startAngle={90}
              endAngle={450} // ✅ Full Circle
              cornerRadius={5} // ✅ Smooth Effect
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>

            {/* ✅ Tooltip with Z-Index Fix */}
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Percentage */}
        <div className="percentage-text">{percentage}%</div>
      </div>

      {/* Bottom Numbers */}
      <div className="bottom-text">
        <p>{completedBids} / {bidSlots} </p>
      </div>
    </div>
  );
};

export default BidPieChart;
