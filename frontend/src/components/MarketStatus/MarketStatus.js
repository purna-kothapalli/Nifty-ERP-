import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarketStatus.css";

function MarketStatus() {
    const [activeTab, setActiveTab] = useState("marketStatus");
    const [stocks, setStocks] = useState([]);
    const [filter, setFilter] = useState("BEARISH");
    const [isSubmitActive, setIsSubmitActive] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [selectedStocks, setSelectedStocks] = useState({});
    const [visibleStocks, setVisibleStocks] = useState(stocks);

    useEffect(() => {
        setVisibleStocks(stocks);
        const updatedPendingUpdates = Object.fromEntries(
            stocks.map((stock) => [stock.companyCode, filter])
        );
        setPendingUpdates(updatedPendingUpdates);
        setIsSubmitActive(true);
        // Update visible stocks with the current filter status
        setVisibleStocks(
            stocks.map((stock) => ({
                ...stock,
                companyStatus: filter,
            }))
        );
    }, [filter, stocks]);

    useEffect(() => {
        axios
            .get("http://localhost:4000/get/company")
            .then((response) => {
                setStocks(response.data.data || []);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                toast.error("Failed to fetch company data.");
            });
    }, []);

    const handleTabChange = async (tab) => {
        setActiveTab(tab);
        handleToggleChange("BEARISH");
    };

    const handleCheckboxChange = (event, companyCode) => {
        setSelectedStocks((prevSelected) => {
            const updatedSelected = { ...prevSelected };
            if (event.target.checked) {
                // Only allow if current selection is less than 10
                if (Object.keys(updatedSelected).length < 10) {
                    updatedSelected[companyCode] = true;
                } else {
                    toast.warn("Maximum of 10 stocks can be selected!", {
                        position: "top-right",
                    });
                }
            } else {
                delete updatedSelected[companyCode];
            }
            return updatedSelected;
        });
    };

    const totalSelectedCount = Object.keys(selectedStocks).length;

    // Disable further selections if 10 stocks are already selected (unless the stock is already selected)
    const isStockDisabled = (stock) => {
        return totalSelectedCount === 10 && !selectedStocks[stock.companyCode];
    };

    const handleProceed = async () => {
        if (totalSelectedCount === 0) {
          toast.warn("Please select at least one stock to proceed!", {
            position: "top-right",
          });
          return;
        }
      
        const updatedStockData = stocks.map((stock) => ({
          ...stock,
          liveBB: !!selectedStocks[stock.companyCode],
        }));
      
        try {
          const response = await axios.put(
            "http://localhost:4000/company/bulk/update/company",
            updatedStockData.map(({ companyId, companyStatus, liveBB }) => ({
              companyId,
              companyStatus,
              liveBB,
            }))
          );
      
          toast.success("Live BB status updated successfully!", {
            position: "top-right",
          });
      
          setStocks(updatedStockData);
          setSelectedStocks({});
          handleTabChange("liveBB");
        } catch (error) {
          console.error("API Error:", error.response?.data || error.message);
          toast.error("Failed to update Live BB status!", { position: "top-right" });
        }
      };
    const handleToggleChange = (newFilter) => {
        setFilter(newFilter);
        const defaultStatus = newFilter.toUpperCase();
        // Update pending status for all stocks
        const updatedPendingUpdates = Object.fromEntries(
            stocks.map((stock) => [stock.companyCode, defaultStatus])
        );
        setPendingUpdates(updatedPendingUpdates);
        setIsSubmitActive(true);
        // Update visible stocks with the new status
        setVisibleStocks(
            stocks.map((stock) => ({
                ...stock,
                companyStatus: defaultStatus,
            }))
        );
    };

    const handleStatusChange = (companyCode, newStatus) => {
        setPendingUpdates((prev) => ({
            ...prev,
            [companyCode]: newStatus,
        }));
        setIsSubmitActive(true);
    };

    const handleSubmit = async () => {
        if (!isSubmitActive) return;
      
        const updatedStocks = stocks.map((stock) => ({
          ...stock,
          companyStatus: pendingUpdates[stock.companyCode] || stock.companyStatus,
        }));
      
        try {
          await axios.post("http://localhost:4000/company/update/all", updatedStocks);
      
          setStocks(updatedStocks);
          setPendingUpdates({});
          setIsSubmitActive(false);
          toast.success("Market status updated successfully!", {
            position: "top-right",
          });
        } catch (error) {
          console.error("API Error:", error.response?.data || error.message);
          toast.error("Failed to update market status!", {
            position: "top-right",
          });
        }
      };
      
      

    // Optional sorting for liveBB tab (you can adjust this as needed)
    const liveBBStocks = stocks.sort((a, b) => {
        const statusA = a.companyStatus === (filter || "BEARISH") ? 1 : 0;
        const statusB = b.companyStatus === (filter || "BEARISH") ? 1 : 0;
        return statusB - statusA;
    });


    return (
        <div id="marketStatusContainer" className="market-status-container">
            <div className="markets-header-container">
                <div className="tab-container">
                    <button
                        className={`tab ${activeTab === "marketStatus" ? "active" : ""}`}
                        onClick={() => handleTabChange("marketStatus")}
                    >
                        Market Status
                    </button>
                    <button
                        className={`tab ${activeTab === "liveBB" ? "active" : ""}`}
                        onClick={() => handleTabChange("liveBB")}
                    >
                        Live BB
                    </button>
                </div>
                <ToastContainer position="top-right" style={{ marginTop: "65px" }} />

                {activeTab === "marketStatus" && (
                    <div className="toggle-switch-container">
                        <span className="toggle-text">BEARISH</span>
                        <div>
                            <label className="switch-button" htmlFor="switch">
                                <div className="switch-outer">
                                    <input
                                        id="switch"
                                        type="checkbox"
                                        checked={filter === "BULLISH"}
                                        onChange={() =>
                                            handleToggleChange(filter === "BULLISH" ? "BEARISH" : "BULLISH")
                                        }
                                    />
                                    <div className="button">
                                        <span className="button-toggle"></span>
                                        <span className="button-indicator"></span>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <span className="toggle-text">BULLISH</span>
                    </div>
                )}
            </div>

            {activeTab === "marketStatus" && (
                <>
                    <div className="market-stocks-container">
                        {visibleStocks
                            .slice() // ensure we don't mutate original
                            .sort((a, b) => a.companyName.localeCompare(b.companyName))
                            .map((stock) => (
                                <div key={stock.companyCode} className="stock-box">
                                    <span className="stock-symbol">{stock.companyName}</span>
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`status-${stock.companyCode}`}
                                                value="BULLISH"
                                                checked={
                                                    pendingUpdates[stock.companyCode] !== undefined
                                                        ? pendingUpdates[stock.companyCode] === "BULLISH"
                                                        : stock.companyStatus === "BULLISH"
                                                }
                                                onChange={() => handleStatusChange(stock.companyCode, "BULLISH")}
                                            />
                                            Bullish
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name={`status-${stock.companyCode}`}
                                                value="BEARISH"
                                                checked={
                                                    pendingUpdates[stock.companyCode] !== undefined
                                                        ? pendingUpdates[stock.companyCode] === "BEARISH"
                                                        : stock.companyStatus === "BEARISH"
                                                }
                                                onChange={() => handleStatusChange(stock.companyCode, "BEARISH")}
                                            />
                                            Bearish
                                        </label>
                                    </div>
                                </div>
                            ))}
                    </div>
                    <button className="market-submit-button" disabled={!isSubmitActive} onClick={handleSubmit}>
                        Submit
                    </button>
                </>
            )}

            {activeTab === "liveBB" && (
                <>
                    {/* Bearish Stocks in their own container */}
                    <div className="live-bb-container">
                        {liveBBStocks
                            .filter((stock) => stock.companyStatus === "BEARISH")
                            .slice()
                            .sort((a, b) => a.companyName.localeCompare(b.companyName))
                            .map((stock) => (
                                <div
                                    key={stock.companyCode}
                                    className={`stock-box live-stock-box ${isStockDisabled(stock) && !selectedStocks[stock.companyCode]
                                        ? "disabled-container"
                                        : ""
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        className="live-checkbox"
                                        checked={!!selectedStocks[stock.companyCode]}
                                        onChange={(e) => handleCheckboxChange(e, stock.companyCode)}
                                        disabled={isStockDisabled(stock)}
                                    />

                                    {/* Stock Name */}
                                    <span className="stock-symbol">{stock.companyName}</span>

                                    {/* Radio Button Group */}
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`status-${stock.companyCode}`}
                                                value={stock.companyStatus}
                                                checked={
                                                    stock.companyStatus === "BULLISH" ||
                                                    stock.companyStatus === "BEARISH"
                                                }
                                                disabled={isStockDisabled(stock)}
                                            />
                                            {stock.companyStatus === "BULLISH" ? "Bullish" : "Bearish"}
                                        </label>
                                    </div>
                                </div>
                            ))}
                    </div>
                    {/* Bullish Stocks in their own container */}
                    <div className="live-bb-container">
                        {liveBBStocks
                            .filter((stock) => stock.companyStatus === "BULLISH")
                            .slice()
                            .sort((a, b) => a.companyName.localeCompare(b.companyName))
                            .map((stock) => (
                                <div
                                    key={stock.companyCode}
                                    className={`stock-box live-stock-box ${isStockDisabled(stock) && !selectedStocks[stock.companyCode]
                                        ? "disabled-container"
                                        : ""
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        className="live-checkbox"
                                        checked={!!selectedStocks[stock.companyCode]}
                                        onChange={(e) => handleCheckboxChange(e, stock.companyCode)}
                                        disabled={isStockDisabled(stock)}
                                    />

                                    {/* Stock Name */}
                                    <span className="stock-symbol">{stock.companyName}</span>

                                    {/* Radio Button Group */}
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`status-${stock.companyCode}`}
                                                value={stock.companyStatus}
                                                checked={
                                                    stock.companyStatus === "BULLISH" ||
                                                    stock.companyStatus === "BEARISH"
                                                }
                                                disabled={isStockDisabled(stock)}
                                            />
                                            {stock.companyStatus === "BULLISH" ? "Bullish" : "Bearish"}
                                        </label>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <button
                        className="market-submit-button"
                        onClick={handleProceed}
                        disabled={totalSelectedCount === 0}
                    >
                        Proceed
                    </button>
                </>
            )}




        </div>
    );
}

export default MarketStatus;
