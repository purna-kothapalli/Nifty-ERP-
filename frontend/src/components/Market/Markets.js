import React, { useEffect, useState } from "react";
import "./style.css";
import axios from "axios";

const marketImages = {
  Bullish: "bullish.png",
  Bearish: "bearish.png",
  "Nifty Prediction": "nifty-prediction.png",
  "Bank Nifty Prediction": "bank-nifty-prediction.png",
};

const Card = ({ title, color, image, openTime, closeTime, onClick = () => console.log() }) => {
  return (
    <div className={`card ${color}`} onClick={() => onClick(title)}>
      <div className="card-content">
        <h2>{title}</h2>
        <div className="time-container">
          <div className="time-left">
            <p className="des">Opens today</p>
            <p className="time">@ {openTime}</p>
          </div>
          <div className="timer-line"></div>
          <div className="time-right">
            <p className="des">Closes tomorrow</p>
            <p className="time">@ {closeTime}</p>
          </div>
        </div>
      </div>
      <div className="card-icon">
        <img src={image} alt={title} className="icon" />
      </div>
    </div>
  );
};

const Markets = ({ onSelectMarket }) => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get("http://localhost:4000/get/market");
        setMarketData(response.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching market data:", error);
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  return (
    <div className="cards-container">
      {loading ? (
        <p>Loading market data...</p>
      ) : (
        marketData.map((market) => {
          const color = market.marketName
            ? market.marketName.toLowerCase().replace(/\s+/g, "-")
            : "default";


          return (
            <Card
              key={market.marketId}
              title={market.marketName}
              color={color}
              image={marketImages[market.marketName] || "default.png"}
              openTime={market.openingTime}
              closeTime={market.closingTime}
              onClick={onSelectMarket}
            />
          );
        })
      )}
      <button className="floating-button">☰</button>
    </div>
  );
};

export default Markets;
