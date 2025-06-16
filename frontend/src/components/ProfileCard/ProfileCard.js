import React, { useState, useEffect } from "react";
import "./ProfileCard.css";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaGift,
  FaKey,
  FaIdCard,
  FaMobileAlt,
  FaMoneyBillWave,
  FaUsers,
} from "react-icons/fa";
import { RiBankLine } from "react-icons/ri";
import { BsCardList, BsInfoCircleFill } from "react-icons/bs";


const Card = ({ title, color, icon, data }) => {
  return (
    <div className="all-card dashboard-card-container profile-card">
      <div className="all-card-content dashboard-content">
        <h2>{title}</h2>
        <div className="all-time-container">
          <div className="all-time-left">
            <h6 className="all-time-res">{data}</h6>
          </div>
        </div>
      </div>
      <div className={`all-card-icon ${color}`}>
        <img src={icon} alt={title} className="all-icon" />
      </div>
    </div>
  );
};

const ProfileCard = ({ selectedUser: userId, setActiveTab }) => {

  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaysBids, setTodaysBids] = useState([]);
  const [filterType, setFilterType] = useState("Bullish");
  const [selectedBid, setSelectedBid] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [bullishBids, setBullishBids] = useState(0);
  const [bearishBids, setBearishBids] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState(userId || localStorage.getItem('selectedUserId'));
const [selectedUserInfo, setSelectedUserInfo] = useState(null);
   // Simulating data loading
   useEffect(() => {
    // Simulate a delay, like fetching user data
    setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds (simulate loading)
    }, 1000);
  }, []);


  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("https://dev-erp.nifty10.in/users/list");
        const data = await response.json();

        if (data?.content) {
          setUsers(data.content);
        } else {
          setError("Invalid API response");
        }
      } catch (error) {
        setError("Error fetching users. Please try again later.");
      } 
    };

    fetchUsers();
    fetchUserInfo(selectedUserId);
  }, [selectedUserId]);

  // Filter user data after users are loaded
  useEffect(() => {

    if (users.length > 0 && selectedUserId) {
      const filteredUser = users.find(
        (user) => String(user.userId) === String(selectedUserId)
      );
      setUserData(filteredUser || null);
      setSelectedUserId(selectedUserId);
      fetchBids(selectedUserId);
    }
  }, [users, userId, selectedUserId]);
 const fetchUserInfo = async (userId) => {
      try {
        setLoading(true);
        setError(null);
        const url = new URL("https://dev-erp.nifty10.in/user/getUserById"); 
        url.searchParams.append("userId", userId); 

        const response = await fetch(url, {
          method: "GET", // Use GET request
        });
        const data = await response.json();
        

        if (data.data) {
          setSelectedUserInfo(data.data);
        } else {
          setError("User info not found.");
        }
      } catch (error) {
        setError("Error fetching user info.");
      } finally {
        setLoading(false);
      }
    };
  // Fetch placed bids and calculate totals
  // Fetch placed bids and calculate totals
const fetchBids = async (userId) => {
  try {
    const url = new URL("https://dev-erp.nifty10.in/user/bids");
    url.searchParams.append("userId", userId);  // Add userId as a query parameter dynamically

    const response = await fetch(url, {
      method: "GET", // Use GET request
    });
    const result = await response.json();

    if (!result?.bids || !Array.isArray(result.bids)) {
      setTodaysBids([]);
      return;
    }

    const allBids = result.bids;
    
    // Define the UTC boundaries:
    // Today (UTC midnight) and yesterday
    const now = new Date();
    const todayAt9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
    const yesterdayAt4pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 0, 0, 0);

    // Set the boundaries in UTC:
    // Start: Yesterday at 16:00 UTC
    // End: Today at 09:00 UTC
     const startTimeUTC = new Date(Date.UTC(
      yesterdayAt4pm.getUTCFullYear(),
      yesterdayAt4pm.getUTCMonth(),
      yesterdayAt4pm.getUTCDate(),
      yesterdayAt4pm.getUTCHours() + 5,
      yesterdayAt4pm.getUTCMinutes() + 30,
      yesterdayAt4pm.getUTCSeconds()
    ));
    const endTimeUTC = new Date(Date.UTC(
      todayAt9am.getUTCFullYear(),
      todayAt9am.getUTCMonth(),
      todayAt9am.getUTCDate(),
      todayAt9am.getUTCHours() + 5,
      todayAt9am.getUTCMinutes() + 30,
      todayAt9am.getUTCSeconds()
    ));

    // Debug: Uncomment these lines to check your boundary values in the console
    // console.log("Start Time (UTC):", startTimeUTC.toISOString());
    // console.log("End Time (UTC):", endTimeUTC.toISOString());

    // Filter bids based on the new UTC time boundaries
    const todaysBidList = allBids.filter((bid) => {
      const bidDate = new Date(bid.createdDate); // Assuming bid.createdDate is in a format that JS Date parses as UTC
      return bidDate >= startTimeUTC && bidDate <= endTimeUTC;
    });

    setTodaysBids(todaysBidList);

    // Count bullish and bearish bids from today's bids
    const bullishCount = todaysBidList.filter(
      (bid) => bid.dailyBid.marketName === "Bullish"
    ).length;
    const bearishCount = todaysBidList.filter(
      (bid) => bid.dailyBid.marketName === "Bearish"
    ).length;

    setBullishBids(bullishCount);
    setBearishBids(bearishCount);

    // Filter bids to only include non-free ones for totals
    const todaysNonFreeBids = todaysBidList.filter(
      (bid) => bid.freeBid === false
    );

    // Calculate invested and won amounts based on non-free bids
    const totalInvested = todaysNonFreeBids.reduce(
      (sum, bid) => sum + (bid.paidPoint || 0),
      0
    );
    const totalWon = todaysNonFreeBids.reduce(
      (sum, bid) => sum + (bid.winningPoint || 0),
      0
    );

    // Update user data with today's totals
    setUserData((prev) => ({
      ...prev,
      totalInvested,
      totalWon,
    }));
  } catch (error) {
    console.error("Error fetching bids:", error);
    setTodaysBids([]);
  }
};
if (loading) return (
  <div className="loading-container">
    <p className="loading-user-data">Loading user data</p>
  </div>
);
  if (error) return <p className="error">{error}</p>;
  if (!userData) return <p className="error">User not found</p>;
  if (!userId && !localStorage.getItem("selectedUserId")) return <p>No user selected</p>;
  return (
    <div className="profile-container">
      {/* Header */}
      <button
        className="profile-back-btn"
        onClick={() => setActiveTab("users-info")}
      >
        Back
      </button>
      <div className="profile-header">
        <FaUser className="profile-avatar" />
        <div>
          <h2 className="user-name">{userData?.name || "NA"}</h2>
          <p className="user-type">{userData?.userType || "NA"}</p>
        </div>
        <div className="user-stats">
          <p>
            <strong>Total Invested:</strong> ₹
            {userData?.totalInvested?.toFixed(2) || "0.00"}
          </p>
          <p>
            <strong>Total Won:</strong> ₹
            {userData?.totalWon?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div
          className="payment-history-button"
          onClick={() => setActiveTab("payment-history")}
        >
          Payment History
        </div>

        <div
          className={`status-button ${
            userData?.isActive ? "active" : "inactive"
          }`} 
        >
          {userData?.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Left Side */}
        <div className="profile-left">
          {/* Personal Information */}
          <div className="profile-section">
  <h3>Personal Information</h3>
  <p>
    <FaPhone className="profile-icon" /> {userData?.mobileNo || "NA"}
  </p>
  <p>
    <FaEnvelope className="profile-icon" /> {userData?.email || "NA"}
  </p>
  <p>
    <FaGift className="profile-icon" /> Referral Code:{" "}
    {userData?.referralCode || "NA"}
  </p>
  <p>
    <FaCalendarAlt className="profile-icon" /> Joined:{" "}
    {userData?.createdDate
      ? new Date(userData.createdDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "NA"}
  </p>
  <p>
    <FaUsers className="profile-icon" /> Referrals:{" "}
    {userData?.referralSummary?.referralCount ?? "NA"}
  </p>
  <p>
    <FaMoneyBillWave className="profile-icon" /> Referral Bonus: ₹
    {userData?.referralSummary?.referralBonus ?? "0"}
  </p>
</div>



          {/* Statistics */}
          <div className="profile-section">
            <h3>Statistics</h3>
            <div className="statistics-container">
              <Card
                key={1}
                title="INVESTED MONEY"
                icon="./rupee-symbol.png"
                color="Bullish"
                data={`₹${
                  selectedUserInfo?.investedMoney
                    ? selectedUserInfo.investedMoney.toFixed(2)
                    : "0.00"
                }`}
              />
              <Card
                key={2}
                title="WALLET"
                icon="./rupee-wallet.png"
                color="Bearish"
                data={`₹${
                  selectedUserInfo?.points ? selectedUserInfo.points.toFixed(2) : "0.00"
                }`}
              />
              <Card
                key={3}
                title="EARNED MONEY"
                icon="./rupee-symbol.png"
                color="Nifty Prediction"
                data={`₹${
                  selectedUserInfo?.earnedMoney
                    ? selectedUserInfo.earnedMoney.toFixed(2)
                    : "0.00"
                }`}
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="profile-section">
            <h3>Bank Details</h3>
            <p>
              <RiBankLine className="profile-icon" /> Bank Name:{" "}
              {userData?.bankName || "NA"}
            </p>
            <p>
              <BsCardList className="profile-icon" /> Branch:{" "}
              {userData?.branch || "NA"}
            </p>
            <p>
              <FaIdCard className="profile-icon" /> Account No:{" "}
              {userData?.accountNumber || "NA"}
            </p>
            <p>
              <FaKey className="profile-icon" /> IFSC Code:{" "}
              {userData?.ifscCode || "NA"}
            </p>
            <p>
              <FaMobileAlt className="profile-icon" /> UPI ID:{" "}
              {userData?.upiId || "NA"}
            </p>
          </div>
          <div className="profile-section">
            <h3>E-KYC Details</h3>
            <div className="statistics-container">
              <Card
                key="aadhaar"
                title="AADHAAR NO"
                icon="./id-card.png"
                color="Bullish"
                data={
                  <>
                    <div>{userData?.adharNo || "NA"}</div>
                    <div style={{ fontSize: "0.85rem", color: userData?.isAadharVerified ? "green" : "red" }}>
                      {userData?.isAadharVerified ? "Verified" : "Not Verified"}
                    </div>
                  </>
                }
              />
              <Card
                key="pan"
                title="PAN NO"
                icon="./pan-card.png"
                color="Bearish"
                data={
                  <>
                    <div>{userData?.panNumber || "NA"}</div>
                    <div style={{ fontSize: "0.85rem", color: userData?.isPanVerified ? "green" : "red" }}>
                      {userData?.isPanVerified ? "Verified" : "Not Verified"}
                    </div>
                  </>
                }
              />
            </div>
          </div>

        </div>
        {/* Right Side: Today's Bids */}

        <div className="bids-card">
          
          <h3>Today's Bids</h3>
          <p className="bids-count">
            {todaysBids.filter((bid) => bid.freeBid === false).length}
          </p>

          {/* Tab Filters */}
          <div className="bids-tab-container">
            <div
              className={`bids-tab-btn ${
                filterType === "Bullish" ? "active-markets-tab" : ""
              }`}
              onClick={() => setFilterType("Bullish")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && setFilterType("Bullish")
              }
            >
              Bullish {filterType === "Bullish" && `(${bullishBids})`}
            </div>
            <div
              className={`bids-tab-btn ${
                filterType === "Bearish" ? "active-markets-tab" : ""
              }`}
              onClick={() => setFilterType("Bearish")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && setFilterType("Bearish")
              }
            >
              Bearish {filterType === "Bearish" && `(${bearishBids})`}
            </div>
          </div>

          {/* Filtered and Sorted Bids */}
          <div className="bids-card-container">
            {todaysBids
              .filter((bid) => bid.dailyBid?.marketName === filterType)
              .sort((a, b) => {
                // Sort so that paid bids (freeBid false) come first
                if (a.freeBid === b.freeBid) return 0;
                return a.freeBid ? 1 : -1;
              })
              .map((bid, index) => (
                <div className="stat-card" key={index}>
                  <div className="bid-type-container">
                    <div
                      className="bids-info-container"
                      onClick={() => {
                        setSelectedBid(bid);
                        setShowInfoModal(true);
                      }}
                    >
                      <BsInfoCircleFill className="bids-info-icon" />
                    </div>

                    {showInfoModal && selectedBid && (
                      <div
                        className="bid-info-modal-overlay"
                        onClick={() => setShowInfoModal(false)}
                      >
                        <div
                          className="bid-info-modal animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h2 className="bid-info-title">Bid Information</h2>
                          <div className="bid-info-row">
                            <span>Day Bid Code:</span>{" "}
                            <strong>
                              {selectedBid.dailyBid?.dayBidCode || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Market:</span>{" "}
                            <strong>
                              {selectedBid.dailyBid?.marketName || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Entry Fee:</span>
                            <strong>
                              {selectedBid.dailyBid?.freeBid ? (
                                <>
                                  <del className="free-bid-strike">
                                    ₹{selectedBid.dailyBid?.entryFee || "NA"}
                                  </del>{" "}
                                  <span style={{ color: "green" }}>Free</span>
                                </>
                              ) : (
                                <>₹{selectedBid.dailyBid?.entryFee || "NA"}</>
                              )}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Pool Prize:</span>{" "}
                            <strong>
                              ₹{selectedBid.dailyBid?.poolPrize || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>First Prize:</span>{" "}
                            <strong>
                              ₹{selectedBid.dailyBid?.firstPrize || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Total Slots:</span>{" "}
                            <strong>
                              {selectedBid.dailyBid?.bidSlots || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Type:</span>{" "}
                            <strong>
                              {selectedBid.dailyBid?.bidType || "NA"}
                            </strong>
                          </div>
                          <div className="bid-info-row">
                            <span>Bid Created At:</span>
                            <strong>
                              {selectedBid?.createdDate
                                ? (() => {
                                    const date = new Date(
                                      selectedBid.createdDate
                                    );
                                    const day = String(
                                      date.getUTCDate()
                                    ).padStart(2, "0");
                                    const month = String(
                                      date.getUTCMonth() + 1
                                    ).padStart(2, "0"); // months are 0-indexed
                                    const year = date.getUTCFullYear();
                                    const hours = String(
                                      date.getUTCHours()
                                    ).padStart(2, "0");
                                    const minutes = String(
                                      date.getUTCMinutes()
                                    ).padStart(2, "0");
                                    const seconds = String(
                                      date.getUTCSeconds()
                                    ).padStart(2, "0");
                                    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
                                  })()
                                : "NA"}
                            </strong>
                          </div>
                          <button
                            className="cancel-btn1"
                            onClick={() => setShowInfoModal(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bid-stats-row">
                    <div>
                      <span className="bid-stats-label">Entry Fee: </span>
                      <strong>
                        {bid.freeBid ? (
                          <>
                            <del className="bid-stats-value free-bid-strike">
                              ₹{bid.paidPoint || "NA"}
                            </del>{" "}
                            <span style={{ color: "green" }}>Free</span>
                          </>
                        ) : (
                          <span className="bid-stats-value">
                            ₹{bid.paidPoint || "NA"}
                          </span>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="bid-stats-label">Points: </span>
                      <span className="bid-stats-value">
                        {bid.totalPointCount.toFixed(2) ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="bid-stats-label">Won: </span>
                      <span className="bid-stats-value">
                        {bid.winningPoint !== undefined
                          ? bid.winningPoint.toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                  <div className="bid-companies">
                    <strong>Companies:</strong>
                    <div className="companies-grid">
                      {bid.listBidCompany?.map((company, i) => (
                        <div
                          key={i}
                          className={`company-tag ${
                            company?.specialCompany
                              ? filterType === "Bullish"
                                ? "big-bull-tag1"
                                : filterType === "Bearish"
                                ? "big-bear-tag1"
                                : ""
                              : ""
                          }`}
                        >
                          <span
                            className={`company-dot ${
                              company.companyStatus === "BULLISH"
                                ? "bullish-dot"
                                : "bearish-dot"
                            }`}
                          ></span>
                          {company?.companyName || "Unknown"}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;