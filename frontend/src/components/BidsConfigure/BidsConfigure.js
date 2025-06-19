import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BidsConfigure.css";

const BidsConfigure = () => {
  const [markets, setMarkets] = useState([]);
  const [bids, setBids] = useState([]);
  const [editingBid, setEditingBid] = useState(null);
  const [formData, setFormData] = useState({
    entryFee: "",
    poolPrizePercent: "",
    firstPrize: "",
    bidSlots: "",
    individualBidCount: "",
    marketId: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMarkets();
    fetchBids();
  }, []);

  const fetchMarkets = async () => {
    try {
      const res = await axios.get("https://prod-erp.nifty10.in/get/market");
      setMarkets(res.data.data || []);
    } catch (err) {
      console.error("Error fetching markets:", err);
    }
  };

  const fetchBids = async () => {
    try {
      const res = await fetch("https://prod-erp.nifty10.in/bids/config");
      const json = await res.json();
      setBids(json.data || []);
    } catch (err) {
      console.error("Error fetching bids:", err);
    }
  };

  const handleEditClick = (bid) => {
    const isCombo = bid.marketNames?.includes("Bullish") && bid.marketNames.includes("Bearish");

    setEditingBid(bid);
    setFormData({
      entryFee: bid.entryFee,
      poolPrizePercent: ((bid.poolPrize / (bid.entryFee * bid.bidSlots)) * 100).toFixed(2),
      firstPrize: bid.firstPrize,
      bidSlots: bid.bidSlots,
      individualBidCount: bid.individualBidCount,
      marketId: isCombo
        ? "bullish_bearish_combo"
        : markets.find((m) => m.marketName === bid.marketNames[0])?.marketId || "",
    });
    setErrors({});
  };


  const handleCancel = () => {
    setEditingBid(null);
    setFormData({
      entryFee: "",
      poolPrizePercent: "",
      firstPrize: "",
      bidSlots: "",
      individualBidCount: "",
      marketId: "",
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    const {
      entryFee,
      poolPrizePercent,
      firstPrize,
      bidSlots,
      individualBidCount,
      marketId,
    } = formData;

    if (!entryFee) errs.entryFee = "Required";
    if (!poolPrizePercent) errs.poolPrizePercent = "Required";
    if (!firstPrize) errs.firstPrize = "Required";
    if (!bidSlots) errs.bidSlots = "Required";
    if (!individualBidCount) errs.individualBidCount = "Required";
    if (!marketId) errs.marketId = "Required";

    const collected = Number(entryFee) * Number(bidSlots);
    const actualPrizePool = (Number(poolPrizePercent) / 100) * collected;

    if (Number(poolPrizePercent) > 100) {
      errs.poolPrizePercent = "Cannot exceed 100%";
    }

    if (Number(firstPrize) > actualPrizePool) {
      errs.firstPrize = "Cannot be more than the total prize pool";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const collected = Number(formData.entryFee) * Number(formData.bidSlots);
      const actualPrizePool = (Number(formData.poolPrizePercent) / 100) * collected;

      let selectedMarkets = [];
      if (formData.marketId === "bullish_bearish_combo") {
        selectedMarkets = markets.filter(m => m.marketName === "Bullish" || m.marketName === "Bearish");
      } else {
        selectedMarkets = markets.filter(m => m.marketId === formData.marketId);
      }

      for (const market of selectedMarkets) {
        const updatedBid = {
          ...editingBid,
          entryFee: Number(formData.entryFee),
          poolPrize: Math.floor(actualPrizePool),
          firstPrize: Number(formData.firstPrize),
          bidSlots: Number(formData.bidSlots),
          individualBidCount: Number(formData.individualBidCount),
          marketId: market.marketId,
          marketName: market.marketName,
          modifiedBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985",
          modifiedDate: new Date().toISOString(),
        };

        await axios.post("https://dev-erp.nifty10.in/bids/update", updatedBid, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      }

      console.log("✅ Updated successfully");
      fetchBids();
      handleCancel();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };


  const merged = [];
  bids.forEach((b) => {
    const key = `${b.bidName}-${b.entryFee}-${b.bidSlots}-${b.poolPrize}`;
    const exist = merged.find((m) => m._key === key);
    if (exist) {
      if (!exist.marketNames.includes(b.marketName)) {
        exist.marketNames.push(b.marketName);
      }
    } else {
      merged.push({ ...b, _key: key, marketNames: [b.marketName] });
    }
  });

  merged.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));

  const displayBids = merged.map((b) => {
    const hasBull = b.marketNames.includes("Bullish");
    const hasBear = b.marketNames.includes("Bearish");
    return {
      ...b,
      displayName: hasBull && hasBear ? "Bullish & Bearish" : b.marketNames.join(", "),
    };
  });

  return (
    <div className="uni-main-container">
      {editingBid ? (
        <div className="uni-bid-form-container1">
          <h3 className="uni-form-heading">Edit Bid</h3>
          <form onSubmit={handleSubmit} className="uni-bid-form-grid">
            {[
              { label: "Entry Fee", name: "entryFee" },
              { label: "Prize Pool (%)", name: "poolPrizePercent" },
              { label: "First Prize", name: "firstPrize" },
              { label: "Bid Slots", name: "bidSlots" },
              { label: "Individual Count", name: "individualBidCount" },
            ].map(({ label, name }) => (
              <div className="uni-form-group" key={name}>
                <label>{label}</label>
                <input
                  type="number"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
                {errors[name] && <p className="uni-error-text">{errors[name]}</p>}
              </div>
            ))}
            <div className="uni-form-group">
              <label>Market</label>
              <select name="marketId" value={formData.marketId} onChange={handleChange}>
                <option value="">Select Market</option>
                <option value="bullish_bearish_combo">Bullish & Bearish</option> {/* Combo option */}
                {markets.map((m) => (
                  <option key={m.marketId} value={m.marketId}>
                    {m.marketName}
                  </option>
                ))}
              </select>

              {errors.marketId && <p className="uni-error-text">{errors.marketId}</p>}
            </div>

            <div
              className="uni-form-group uni-submit-container"
              style={{
                gridColumn: "1 / span 2",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <button
                type="button"
                className="uni-remove-button1"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="uni-submit-button">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bids-table-container">
          <h2 className="uni-form-heading">Bid Configure</h2>
          <table className="uni-bids-table">
            <thead>
              <tr>
                <th>Entry Fee</th>
                <th>Prize Pool (%)</th>
                <th>First Prize</th>
                <th>Bid Slots</th>
                <th>Market</th>
                <th>Active</th>
                <th>Individual Slots</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayBids.map((bid) => {
                const amountCollected = bid.entryFee * bid.bidSlots;
                const poolPercentage = amountCollected
                  ? ((bid.poolPrize / amountCollected) * 100).toFixed(2)
                  : "0.00";

                return (
                  <tr key={bid._key}>
                    <td>{bid.entryFee}</td>
                    <td>{poolPercentage}%</td>
                    <td>₹ {bid.firstPrize}</td>
                    <td>{bid.bidSlots}</td>
                    <td>{bid.displayName}</td>
                    <td>{bid.active ? "✅" : "❌"}</td>
                    <td>{bid.individualBidCount}</td>
                    <td>{new Date(bid.createdDate).toLocaleDateString("en-GB")}</td>
                    <td>
                      <button
                        className="uni-add-row-button"
                        onClick={() => handleEditClick(bid)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BidsConfigure;
