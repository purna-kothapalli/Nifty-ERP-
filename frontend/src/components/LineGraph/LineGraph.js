import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
const marketColors = {
  Bullish: "#8EE4AF",
  Bearish: "#FF6F61",
  "Nifty Prediction": "#74A9D8",
  "Bank Nifty Prediction": "#FFAD60",
};

const MonthlyLineGraph = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = "556c3d52-e18d-11ef-9b7f-02fd6cfaf985";
  const marketIds = [
    "6187ba91-e190-11ef-9b7f-02fd6cfaf985",
    "877c5f82-e190-11ef-9b7f-02fd6cfaf985",
    "97f37603-e190-11ef-9b7f-02fd6cfaf985",
    "9f0c2c24-e190-11ef-9b7f-02fd6cfaf985",
  ];
  const categoryMap = {
    bullish: "Bullish",
    bearish: "Bearish",
    "nifty prediction": "Nifty Prediction",
    "bank nifty prediction": "Bank Nifty Prediction",
  };

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const months = Array.from({ length: 3 }, (_, i) => i); // Jan to Mar only

        const monthlyResults = [];

        for (const monthIndex of months) {
          const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
          const monthData = {
            month: new Date(currentYear, monthIndex).toLocaleString("default", {
              month: "short",
            }),
            Bullish: 0,
            Bearish: 0,
            "Nifty Prediction": 0,
            "Bank Nifty Prediction": 0,
          };

          for (let day = 1; day <= daysInMonth; day++) {
            const formattedDay = day.toString().padStart(2, "0");
            const formattedMonth = (monthIndex + 1).toString().padStart(2, "0");
            const formattedDate = `${formattedDay}-${formattedMonth}-${currentYear}`;

            const dailyRequests = marketIds.map((marketId) =>
              fetch(
                `https://prod-api.nifty10.com/bid/market?Date=${formattedDate}&marketId=${marketId}&userId=${userId}`
              )
                .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
                .catch(() => ({ data: [] }))
            );

            const dailyResults = await Promise.all(dailyRequests);
            const allBids = dailyResults.flatMap((r) => r?.data || []);
            const validBids = allBids.filter((b) => b?.active && !b?.freeBid);

            validBids.forEach((bid) => {
              const categoryKey = Object.keys(categoryMap).find((key) =>
                bid.marketName?.toLowerCase().includes(key)
              );
              if (!categoryKey) return;

              const category = categoryMap[categoryKey];
              const completed = bid.bidSlots - bid.totalAvailableCount;
              monthData[category] += completed;
            });
          }

          monthlyResults.push(monthData);
        }

        setMonthlyData(monthlyResults);
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);



  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Monthly Bid Trend</h3>
      </div>

      {loading ? (
        <div className="box-graph-load-container">
          <p className="loading-message box-graph-load">Loading data, please wait...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={monthlyData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="month"
              tick={{ fill: "#aaa" }}
              label={{
                value: "Month",
                position: "outsideBottom",
                dy: 10,
                fill: "#666",
                fontWeight: "bold",
              }}
            />
            <YAxis
              tick={{ fill: "#aaa" }}
              label={{
                value: "Total Bids",
                angle: -90,
                position: "insideLeft",
                fill: "#666",
                dx: 7,
                fontWeight: "bold",
              }}
            />
            <Tooltip />
            <Legend />

            {Object.keys(marketColors).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={marketColors[key]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MonthlyLineGraph;
