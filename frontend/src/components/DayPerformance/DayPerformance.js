import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./DayPerformance.css";

const DayPerformance = ({ trend, onBack, marketId }) => {
  // Use the passed marketId or retrieve it from localStorage
  const effectiveMarketId = marketId;

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({});

  // Get today's date in DD-MM-YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const dd = today.getDate().toString().padStart(2, "0");
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    // console.log("Received Market ID in DayPerformance:", effectiveMarketId);
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://dev-erp.nifty10.in/get/company");
        const data = await response.json();
        if (data?.data && Array.isArray(data.data)) {
          const filteredStocks = data.data.filter(
            (stock) =>
              stock?.liveBB === true &&
              stock?.companyStatus.toUpperCase() === trend
          );
          setStocks(filteredStocks.slice(0, 5)); // Show only top 5
        } else {
          console.error("Unexpected API response format", data);
          setStocks([]);
        }
      } catch (error) {
        console.error(`Error fetching ${trend} stocks:`, error);
        setStocks([]);
      }
      setLoading(false);
    };
    fetchStocks();
  }, [trend, effectiveMarketId]);

  // Handle input change
  const handleInputChange = (companyId, value) => {
    setPerformanceData((prev) => ({
      ...prev,
      [companyId]: parseFloat(value) || 0,
    }));
  };

  // Handle form submission with updated payload format and toast notifications
  const handleSubmit = async () => {
    if (!effectiveMarketId) {
      console.error("Market ID is missing");
      toast.error("Market ID is required.");
      return;
    }
  
    const payload = {
      stocks,
      trend,
      effectiveMarketId,
      performanceData,
    };
  
    try {
      const response = await fetch("https://dev-erp.nifty10.in/bids/submit-market-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error:", errorText);
        throw new Error("Failed to submit data");
      }
  
      toast.success("Result submitted successfully!");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Submission failed.");
    }
  };
  

  return (
    <div className="day-performance-container">
      <div className="performance-header">
        <button className="performance-back-btn" onClick={onBack}>
          &larr;
        </button>
        <h1 className="results-title">{trend}</h1>
      </div>
      <h2 className="performance-subtitle">Add Day Performance For Final Result</h2>

      {loading ? (
        <div className="performance-loading-container">
          <div className="performance-loader"></div>
        </div>
      ) : stocks.length > 0 ? (
        <table className="performance-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Day Performance</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.companyId}>
                <td>{stock.companyName}</td>
                <td>
                  <input
                    type="number"
                    className="performance-input"
                    value={performanceData[stock.companyId] || ""}
                    required
                    onChange={(e) =>
                      handleInputChange(stock.companyId, e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data-message">No {trend} stocks available</p>
      )}

      <button
        className="performance-submit-btn"
        onClick={handleSubmit}
        disabled={
          loading ||
          stocks.length === 0 ||
          !stocks.every((stock) => performanceData[stock.companyId] !== undefined && performanceData[stock.companyId] !== "")
        }
      >
        Submit
      </button>
    </div>
  );
};

export default DayPerformance;