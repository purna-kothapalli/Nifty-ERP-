import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BidsConfigure.css";

const BidsConfigure = () => {
  const [markets, setMarkets] = useState([]);
  const [bids, setBids] = useState([]);
  const [editingBid, setEditingBid] = useState(null);
  const [formData, setFormData] = useState({
    entryFee: "",
    poolPrize: "",
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
      // Make a request to the backend with the short URL
      const res = await fetch("https://prod-erp.nifty10.in/bids/config");
      const json = await res.json();
      
      if (json.data) {
        setBids(json.data || []);
      } else {
        console.error("No bids data received");
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
    }
  };
  

  const handleEditClick = (bid) => {
    setEditingBid(bid);
    setFormData({
      entryFee: bid.entryFee,
      poolPrize: bid.poolPrize,
      firstPrize: bid.firstPrize,
      bidSlots: bid.bidSlots,
      individualBidCount: bid.individualBidCount,
      marketId:
        bid.marketNames?.length === 2
          ? ""
          : markets.find((m) => m.marketName === bid.marketNames[0])?.marketId || "",
    });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingBid(null);
    setFormData({
      entryFee: "",
      poolPrize: "",
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
    ["entryFee", "poolPrize", "firstPrize", "bidSlots", "individualBidCount", "marketId"].forEach((key) => {
      if (!formData[key]) errs[key] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
  
    try {
      const market = markets.find((m) => m.marketId === formData.marketId);
  
      const updatedBid = {
        ...editingBid, // include original data
        entryFee: Number(formData.entryFee),
        poolPrize: Number(formData.poolPrize),
        firstPrize: Number(formData.firstPrize),
        bidSlots: Number(formData.bidSlots),
        individualBidCount: Number(formData.individualBidCount),
        marketId: formData.marketId,
        marketName: market?.marketName,
        modifiedBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985",
        modifiedDate: new Date().toISOString(),
      };
  
      // Sending the updated bid data to the backend
      const response = await axios.post(
        "https://prod-erp.nifty10.in/bids/update", 
        updatedBid,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
  
      console.log("✅ Updated successfully", response.data);
      fetchBids();
      handleCancel();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
  

  // Merge Bullish + Bearish for display
// Merge Bullish + Bearish for display
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

// ✅ Sort by modifiedDate in descending order (latest first)
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
            {[{ label: "Entry Fee", name: "entryFee" },
            { label: "Prize Pool", name: "poolPrize" },
            { label: "First Prize", name: "firstPrize" },
            { label: "Bid Slots", name: "bidSlots" },
            { label: "Individual Count", name: "individualBidCount" }].map(
              ({ label, name }) => (
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
              )
            )}
            <div className="uni-form-group">
              <label>Market</label>
              <select name="marketId" value={formData.marketId} onChange={handleChange}>
                <option value="">Select Market</option>
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
                flexDirection: "row"      // prevent wrapping to next line
              }}
            >
              
              <button type="button" className="uni-remove-button1" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="uni-submit-button">Save</button>
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
                <th>Pool Prize</th>
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
              {displayBids.map((bid) => (
                <tr key={bid._key}>
                  <td>{bid.entryFee}</td>
                  <td>₹ {bid.poolPrize}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BidsConfigure;