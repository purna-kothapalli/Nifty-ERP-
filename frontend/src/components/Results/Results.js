import React, { useState, useEffect, useCallback } from "react";
import "./Results.css";
import DayPerformance from "../DayPerformance/DayPerformance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const marketImages = {
  Bullish: "bullish.png",
  Bearish: "bearish.png",
  "Nifty Prediction": "nifty-prediction.png",
  "Bank Nifty Prediction": "bank-nifty-prediction.png",
};

const Card = ({ title, image, activeBids, companyCount, marketId, onClick }) => (
  <div className="all-card results-card" onClick={() => onClick(title, marketId)}>
    <div className="all-card-content">
      <h2>{title}</h2>
      <div className="all-time-container">
        <div className="all-time-left">
          <p className="all-des">Active Bids</p>
          <p className="all-time">{activeBids}</p>
        </div>
        <div className="all-timer-line"></div>
        <div className="all-time-right">
          <p className="all-des">Overall Companies</p>
          <p className="all-time">{companyCount}</p>
        </div>
      </div>
    </div>
    <div className={`all-card-icon ${title}`}>
      <img src={image} alt={title} className="all-icon" />
    </div>
  </div>
);

const Results = () => {
  const [marketData, setMarketData] = useState([]);
  const [bidsData, setBidsData] = useState({});
  const [companiesData, setCompaniesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchMarketData();
    fetchCompaniesData();
  }, []);

  // Fetch Market Data
  const fetchMarketData = async () => {
    try {
      const response = await axios.get("http://localhost:4000/get/market");
      setMarketData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching market data:", error);
      toast.error("Error fetching market data!");
    }
  };

  // Fetch Companies Data
  const fetchCompaniesData = async () => {
    try {
      const response = await axios.get("http://localhost:4000/get/company");
      const companies = response.data.data || [];
      const categorizedCompanies = {
        Bullish: 0,
        Bearish: 0,
        "Nifty Prediction": 0,
        "Bank Nifty Prediction": 0,
      };

      companies.forEach((company) => {
        const status = (company.companyStatus || "").toUpperCase();
        if (status === "BULLISH") categorizedCompanies["Bullish"]++;
        if (status === "BEARISH") categorizedCompanies["Bearish"]++;
        if (status === "NIFTY PREDICTION") categorizedCompanies["Nifty Prediction"]++;
        if (status === "BANK NIFTY PREDICTION") categorizedCompanies["Bank Nifty Prediction"]++;
      });

      setCompaniesData(categorizedCompanies);
    } catch (error) {
      console.error("Error fetching companies data:", error);
      toast.error("Error fetching companies data!");
    }
  };

  // Fetch Bids Data
  const fetchBidsData = useCallback(async () => {
  const formattedDate = new Date().toLocaleDateString("en-GB").split("/").join("-");
  let bidsInfo = {};

  try {
    const requests = marketData.map(({ marketId }) =>
      axios.get("http://localhost:4000/get/bidMarket", {
        params: {
          Date: formattedDate,
          marketId,
        },
      })
    );

    const responses = await Promise.allSettled(requests);

    responses.forEach((response, index) => {
      if (response.status === "fulfilled") {
        const bids = response.value.data.data || [];
        const activeBids = bids.filter((bid) => bid.active && !bid.freeBid).length;
        bidsInfo[marketData[index].marketId] = { activeBids };
      } else {
        console.error(`Error fetching bids for ${marketData[index].marketName}:`, response.reason);
        bidsInfo[marketData[index].marketId] = { activeBids: 0 };
      }
    });

    setBidsData(bidsInfo);
  } catch (error) {
    console.error("Error fetching bids data:", error);
  } finally {
    setLoading(false);
  }
}, [marketData]);


  useEffect(() => {
    if (marketData.length > 0) {
      fetchBidsData();
    }
  }, [marketData, fetchBidsData]);

  // Automatically select Bullish market if none is selected
  useEffect(() => {
    if (marketData.length > 0 && !selectedMarket && !isMobileView) {
      const bullishMarket = marketData.find((m) =>
        m.marketName.toLowerCase().includes("bullish")
      );
      if (bullishMarket) {
        setSelectedMarket(bullishMarket.marketName);
        setSelectedMarketId(bullishMarket.marketId);
      }
    }
  }, [marketData, selectedMarket]);

  // When a card is clicked, store both the market name and its ID
  const handleMarketClick = (marketName, marketId) => {
    setSelectedMarket(marketName);
    setSelectedMarketId(marketId);
  };

  const handleBack = () => {
    setSelectedMarket(null);
    setSelectedMarketId(null);
  };

  return (
    <div className="Results-container">
      <div className="all-cards-container result-cards-container">
        {marketData.map(({ marketId, marketName }) => (
          <React.Fragment key={marketId}>
            <Card
              title={marketName}
              image={marketImages[marketName] || "default.png"}
              activeBids={bidsData[marketId]?.activeBids || 0}
              companyCount={companiesData[marketName] || 0}
              marketId={marketId}
              onClick={handleMarketClick}
            />
            {isMobileView && selectedMarketId === marketId && (
              <div className="results-form-container">
                <DayPerformance
                  trend={selectedMarket.toUpperCase()}
                  marketId={selectedMarketId}
                  onBack={handleBack}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {!isMobileView && selectedMarket && (
        <div className="results-form-container">
          <DayPerformance
            trend={selectedMarket.toUpperCase()}
            marketId={selectedMarketId}
            onBack={handleBack}
          />
        </div>
      )}
      <ToastContainer position="top-right" style={{ marginTop: "65px" }} />
    </div>
  );
};

export default Results;