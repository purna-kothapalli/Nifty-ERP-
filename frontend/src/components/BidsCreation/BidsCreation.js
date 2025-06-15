import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BidsCreation.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BidCreationForm = () => {
  const generateBidCode = () => `#MB${Math.floor(1000 + Math.random() * 9000)}`;
  
  const [formData, setFormData] = useState({
    // Removed bidName input from UI.
    // bidName will be auto-set from entryFee.
    bidName: "",
    bidCode: generateBidCode(),
    entryFee: "",
    poolPrize: "",
    firstPrize: "",
    bidSlots: "",
    individualBidCount: "",  // No default value now.
    guaranteedBidCount: "0",   
    newDayBid: "MANUAL",       
    companyRequired: true,     
    bankRequired: false,       
    marketId: "",
    marketName: "",
    bidType:"REGULAR",
    createdBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985",
    active: true,
    prizeMasterList: [],
  });

  const [markets, setMarkets] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Make the request to the backend
        const response = await axios.get("http://localhost:4000/get/market");
  
        // If markets data is returned, update the state
        if (response.data?.data) {
          setMarkets(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching markets:", error);
      }
    };
  
    fetchMarkets();
  }, []);
  

  // Update field values. If entryFee changes, also set bidName to that value.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // When entryFee is updated, automatically update bidName.
      if (name === "entryFee") {
        updated.bidName = value;
      }

      // If the firstPrize field is updated, update the first row in prizeMasterList
      if (name === "firstPrize") {
        let newPrizeMasterList = [...prev.prizeMasterList];
        if (newPrizeMasterList.length === 0) {
          newPrizeMasterList.push({ level: 1, prize: value, userCount: "" });
        } else {
          newPrizeMasterList[0] = { ...newPrizeMasterList[0], prize: value };
        }
        updated.prizeMasterList = newPrizeMasterList;
      }
      
      return updated;
    });
  };

  const handleMarketChange = (e) => {
    const { value } = e.target;
    if (value === "bullish_bearish") {
      setFormData((prev) => ({
        ...prev,
        marketId: "bullish_bearish",
        marketName: "Bullish & Bearish",
      }));
    } else {
      const selectedMarket = markets.find((m) => m.marketId === value);
      setFormData((prev) => ({
        ...prev,
        marketId: selectedMarket?.marketId || "",
        marketName: selectedMarket?.marketName || "",
      }));
    }
  };

  const handlePrizeChange = (index, field, value) => {
    const updatedPrizes = [...formData.prizeMasterList];
    updatedPrizes[index][field] = value;
    setFormData((prev) => ({ ...prev, prizeMasterList: updatedPrizes }));
  };

  const addPrizeLevel = () => {
    setFormData((prev) => ({
      ...prev,
      prizeMasterList: [
        ...prev.prizeMasterList,
        { level: prev.prizeMasterList.length + 1, prize: "", userCount: "" },
      ],
    }));
  };

  const removePrizeLevel = (index) => {
    const updatedPrizes = formData.prizeMasterList.filter((_, i) => i !== index);
    // Reassign level numbers
    updatedPrizes.forEach((p, i) => (p.level = i + 1));
    setFormData((prev) => ({ ...prev, prizeMasterList: updatedPrizes }));
  };

  const validateForm = () => {
    let newErrors = {};
    const requiredFields = [
      // Removed bidName from validation as it's auto-generated.
      "entryFee",
      "poolPrize",
      "firstPrize",
      "bidSlots",
      "individualBidCount",
      "guaranteedBidCount",
      "marketId",
    ];
    requiredFields.forEach((key) => {
      if (!formData[key]) {
        newErrors[key] = "This field is required";
      }
    });

    // Validate each prize level for required fields
    formData.prizeMasterList.forEach((prize, index) => {
      if (!prize.prize && prize.prize !== 0) {
        newErrors[`prize_${index}`] = "Prize amount is required";
      }
      if (!prize.userCount && prize.userCount !== 0) {
        newErrors[`prizeUser_${index}`] = "User count is required";
      }
    });

    // Validate descending order for prize amounts (level 2 onwards should not exceed previous level)
    for (let i = 1; i < formData.prizeMasterList.length; i++) {
      const prevPrize = parseFloat(formData.prizeMasterList[i - 1].prize);
      const currentPrize = parseFloat(formData.prizeMasterList[i].prize);
      if (!isNaN(prevPrize) && !isNaN(currentPrize) && currentPrize > prevPrize) {
        newErrors[`prize_${i}`] = `Prize for level ${i + 1} cannot be greater than level ${i} prize`;
      }
    }

    // Validate total prize cost (prize amount * user count for each level) does not exceed the prize pool
    const totalPrizeCost = formData.prizeMasterList.reduce((acc, prize) => {
      const prizeAmount = parseFloat(prize.prize);
      const userCount = parseFloat(prize.userCount);
      if (!isNaN(prizeAmount) && !isNaN(userCount)) {
        return acc + prizeAmount * userCount;
      }
      return acc;
    }, 0);
    const poolPrizeValue = parseFloat(formData.poolPrize);
    if (!isNaN(poolPrizeValue) && totalPrizeCost > poolPrizeValue) {
      newErrors["prizeTotal"] =
        "Total cost of prizes (prize amount * user count) exceeds the prize pool";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
  
    try {
      console.log("🚀 Sending Request JSON:", JSON.stringify(formData, null, 2));
  
      if (formData.marketId === "bullish_bearish") {
        // Create bids for both Bullish & Bearish
        await Promise.all(
          [
            { marketId: "6187ba91-e190-11ef-9b7f-02fd6cfaf985", marketName: "Bullish" },
            { marketId: "877c5f82-e190-11ef-9b7f-02fd6cfaf985", marketName: "Bearish" }
          ].map(async ({ marketId, marketName }) => {
            const bidData = { ...formData, marketId, marketName };
            const response = await axios.post(
              "http://localhost:4000/bids/create",
              bidData,
              { headers: { "Content-Type": "application/json" } }
            );
            console.log("✅ Success for marketId", marketId, response.data);
          })
        );
      } else {
        // Create bid for a single selected market
        const selectedMarket = markets.find((m) => m.marketId === formData.marketId);
        const bidData = { ...formData, marketName: selectedMarket?.marketName || "" };
        const response = await axios.post(
          "http://localhost:4000/bids/create",
          bidData,
          { headers: { "Content-Type": "application/json" } }
        );
        console.log("✅ Success:", response.data);
      }
  
      toast.success("Bid Created successfully!", { position: "top-right" });
  
      // Reset the form
      setFormData({
        bidName: "",
        bidCode: generateBidCode(),
        entryFee: "",
        poolPrize: "",
        firstPrize: "",
        bidSlots: "",
        individualBidCount: "",
        guaranteedBidCount: "0",
        newDayBid: "MANUAL",
        companyRequired: true,
        bankRequired: false,
        marketId: "",
        marketName: "",
        bidType: "REGULAR",
        createdBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985",
        active: true,
        prizeMasterList: [],
      });
    } catch (error) {
      console.error("❌ API Error:", error.response ? error.response.data : error.message);
      toast.error("Failed to add Bid. Try again!", { position: "top-right" });
    }
  };
  

  return (
    <div className="uni-bid-form-container">
      <h2 className="uni-form-heading">Bid Creation</h2>
      <ToastContainer position="top-right" style={{ marginTop: "65px" }} />

      <form onSubmit={handleSubmit} className="uni-bid-form-grid">
        {/* Entry Fee */}
        <div className="uni-form-group">
          <label>Entry Fee</label>
          <input
            type="number"
            name="entryFee"
            value={formData.entryFee}
            onChange={handleChange}
            placeholder="Enter Entry Fee"
            required
          />
          {errors.entryFee && <p className="uni-error-text">{errors.entryFee}</p>}
        </div>

        {/* Prize Pool */}
        <div className="uni-form-group">
          <label>Prize Pool</label>
          <input
            type="number"
            name="poolPrize"
            value={formData.poolPrize}
            onChange={handleChange}
            placeholder="Enter Prize Pool"
            required
          />
          {errors.poolPrize && <p className="uni-error-text">{errors.poolPrize}</p>}
          {errors.prizeTotal && <p className="uni-error-text">{errors.prizeTotal}</p>}
        </div>

        {/* First Prize */}
        <div className="uni-form-group">
          <label>First Prize</label>
          <input
            type="number"
            name="firstPrize"
            value={formData.firstPrize}
            onChange={handleChange}
            placeholder="Enter First Prize"
            required
          />
          {errors.firstPrize && <p className="uni-error-text">{errors.firstPrize}</p>}
        </div>

        {/* Bid Slots */}
        <div className="uni-form-group">
          <label>Bid Slots</label>
          <input
            type="number"
            name="bidSlots"
            value={formData.bidSlots}
            onChange={handleChange}
            placeholder="Enter Bid Slots"
            required
          />
          {errors.bidSlots && <p className="uni-error-text">{errors.bidSlots}</p>}
        </div>

        {/* Individual Bid Count */}
        <div className="uni-form-group">
          <label>Individual Bid Count</label>
          <input
            type="number"
            name="individualBidCount"
            value={formData.individualBidCount}
            onChange={handleChange}
            placeholder="Enter Individual Bid Count"
            required
          />
          {errors.individualBidCount && <p className="uni-error-text">{errors.individualBidCount}</p>}
        </div>

        {/* Market */}
        <div className="uni-form-group">
          <label>Market</label>
          <select name="marketId" value={formData.marketId || ""} onChange={handleMarketChange} required>
            <option value="">Select Market</option>
            <option value="bullish_bearish">Bullish & Bearish</option>
            {markets.map((market) => (
              <option key={market.marketId} value={market.marketId}>
                {market.marketName}
              </option>
            ))}
          </select>
          {errors.marketId && <p className="uni-error-text">{errors.marketId}</p>}
        </div>

        {/* Active (Radio Buttons) */}
        <div className="uni-form-group">
          <label>Active</label>
          <div className="company-radio-group">
            <input
              type="radio"
              name="active"
              value="true"
              className="company-radio-input"
              checked={formData.active === true}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
              }
            />
            <label className="company-radio-label">True</label>
            <input
              type="radio"
              name="active"
              value="false"
              className="company-radio-input"
              checked={formData.active === false}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
              }
            />
            <label className="company-radio-label">False</label>
          </div>
        </div>

        {/* Hidden Fields */}
        <input type="hidden" name="guaranteedBidCount" value={formData.guaranteedBidCount} />
        <input type="hidden" name="newDayBid" value={formData.newDayBid} />
        <input type="hidden" name="companyRequired" value={formData.companyRequired} />
        <input type="hidden" name="bankRequired" value={formData.bankRequired} />
        <input type="hidden" name="bidType" value={formData.bidType} />

        {/* Prize Breakdown */}
        <div className="uni-form-group" style={{ gridColumn: "1 / span 2" }}>
          <h3 className="uni-section-title">Prize Breakdown</h3>
          <table className="uni-prize-breakdown-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Level</th>
                <th style={{ width: "35%" }}>Prize Amount</th>
                <th style={{ width: "35%" }}>User Count</th>
                <th style={{ width: "20%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.prizeMasterList.map((prize, index) => (
                <tr key={index}>
                  <td>Lvl {prize.level}</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Prize Amount"
                      value={prize.prize}
                      onChange={(e) => handlePrizeChange(index, "prize", e.target.value)}
                      required
                      disabled={index === 0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      placeholder="User Count"
                      value={prize.userCount}
                      onChange={(e) => handlePrizeChange(index, "userCount", e.target.value)}
                      required
                    />
                    {errors[`prizeUser_${index}`] && (
                      <p className="uni-error-text">{errors[`prizeUser_${index}`]}</p>
                    )}
                    {errors[`prize_${index}`] && (
                      <p className="uni-error-text">{errors[`prize_${index}`]}</p>
                    )}
                  </td>
                  <td>
                    {index !== 0 && (
                      <button
                        type="button"
                        className="uni-remove-button"
                        onClick={() => removePrizeLevel(index)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addPrizeLevel} className="uni-add-row-button">
            Add Row
          </button>
        </div>

        {/* Submit Button */}
        <div className="uni-form-group uni-submit-container" style={{ gridColumn: "1 / span 2", textAlign: "right" }}>
          <button type="submit" className="uni-submit-button">
            Create Bid
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidCreationForm;
