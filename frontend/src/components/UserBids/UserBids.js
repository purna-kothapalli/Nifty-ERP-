import React, { useEffect, useState } from "react";
import { BsInfoCircleFill } from "react-icons/bs";
import "./UserBids.css";

const UserBids = () => {
  const [allBidsData, setAllBidsData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("Bullish");
  const [showFilters, setShowFilters] = useState(false);
  const [filterSpecial, setFilterSpecial] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [sortUsers, setSortUsers] = useState(false);
  const [todaysBids, setTodaysBids] = useState([]);
  const [sortByPoints, setSortByPoints] = useState(false);


  const fetchUsers = async () => {
    try {
      const response = await fetch("https://prod-erp.nifty10.in/users/list");
      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  };

  const fetchUserBids = async (userId) => {
  try {
    const url = new URL("https://prod-erp.nifty10.in/user/bids");
    url.searchParams.append("userId", userId); // Add userId as query param

    const response = await fetch(url, {
      method: "GET",
    });

    const result = await response.json();
    

    return {
      userId,
      bids: Array.isArray(result?.bids) ? result.bids : [],
    };
  } catch (error) {
    console.error(`Error fetching bids for user ${userId}:`, error);
    return { userId, bids: [] };
  }
};


useEffect(() => {
  const loadAllData = async () => {
    setLoading(true);

    const userList = await fetchUsers();
    setUsers(userList);

    const bidsPromises = userList.map((user) => fetchUserBids(user.userId));
    const allBids = await Promise.all(bidsPromises);

    // Set time boundaries (local time converted to UTC)
    const now = new Date();

    // Set today at 9 AM (local time)
    const todayAt9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
    // Convert local todayAt9am to UTC
    const todayAt9amUTC = new Date(Date.UTC(
      todayAt9am.getUTCFullYear(),
      todayAt9am.getUTCMonth(),
      todayAt9am.getUTCDate(),
      todayAt9am.getUTCHours() + 5,
      todayAt9am.getUTCMinutes() + 30,
      todayAt9am.getUTCSeconds()
    ));

    // Set yesterday at 4 PM (local time)
    const yesterdayAt4pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 0, 0, 0);
    // Convert local yesterdayAt4pm to UTC
    const yesterdayAt4pmUTC = new Date(Date.UTC(
      yesterdayAt4pm.getUTCFullYear(),
      yesterdayAt4pm.getUTCMonth(),
      yesterdayAt4pm.getUTCDate(),
      yesterdayAt4pm.getUTCHours() + 5,
      yesterdayAt4pm.getUTCMinutes() + 30,
      yesterdayAt4pm.getUTCSeconds()
    ));
    

    // Filter only bids in the correct time range (between yesterday 4 PM and today 9 AM UTC)
    const filteredData = allBids
      .map(({ userId, bids }) => {
        const validBids = bids.filter((bid) => {
          const bidDate = new Date(bid.createdDate); // This is in UTC
          return bidDate >= yesterdayAt4pmUTC && bidDate <= todayAt9amUTC;
        });

        return validBids.length > 0 ? { userId, bids: validBids } : null;
      })
      .filter(Boolean); // remove nulls

    if (filteredData.length === 0) {
      console.log("No bids placed between yesterday 4 PM and today 9 AM.");
      setTodaysBids([]); // or show a message
    } else {
      setAllBidsData(filteredData);
      setTodaysBids(filteredData);
    }

    setLoading(false);
  };

  loadAllData();
}, []);
const handleClearFilters = () => {
  setFilterSpecial("");     // reset BigBull/BigBear filter
  setSortUsers("");      // reset user sorting
  setSelectedCompany("");   // reset selected company
  setSortByPoints(false);   // reset points sorting
};


  let filteredData = [...todaysBids];

  // 1. Filter and sort individual bids for each user
filteredData = filteredData.map(({ userId, bids }) => {
  const filteredBids = bids.filter((bid) => {
    const matchType = bid.dailyBid?.marketName === filterType;

    const matchSpecial =
      !filterSpecial ||
      (filterSpecial === "BigBull" &&
        bid.listBidCompany?.some(
          (c) => c.specialCompany && c.companyName === selectedCompany
        )) ||
      (filterSpecial === "BigBear" &&
        bid.listBidCompany?.some(
          (c) => c.specialCompany && c.companyName === selectedCompany
        ));

    return matchType && matchSpecial;
  });

  // Sort bids by points descending
  const sortedBids = sortByPoints
    ? filteredBids.sort((a, b) => (b.totalPointCount || 0) - (a.totalPointCount || 0))
    : filteredBids;

  return {
    userId,
    bids: sortedBids,
  };
}).filter((user) => user.bids.length > 0);

// 2. Sort users by highest total points in their bids
if (sortByPoints) {
  filteredData.sort((a, b) => {
    const maxPointsA = Math.max(...a.bids.map(bid => bid.totalPointCount || 0));
    const maxPointsB = Math.max(...b.bids.map(bid => bid.totalPointCount || 0));
    return maxPointsB - maxPointsA;
  });
} else if (sortUsers) {
  filteredData.sort((a, b) => {
    const userA = users.find((u) => u.userId === a.userId)?.name || "";
    const userB = users.find((u) => u.userId === b.userId)?.name || "";
    return userA.localeCompare(userB);
  });
}

  if (sortUsers) {
    filteredData.sort((a, b) => {
      const userA = users.find((u) => u.userId === a.userId)?.name || "";
      const userB = users.find((u) => u.userId === b.userId)?.name || "";
      return userA.localeCompare(userB);
    });
  }

  const allCompanies = Array.from(
    new Set(
      allBidsData.flatMap((d) =>
        d.bids.flatMap((b) => b.listBidCompany?.map((c) => c.companyName))
      )
    )
  )
    .filter(Boolean)
    .slice(0, 50)
    .sort();

  if (loading) {
    return (
      <div className="loading-container">
    <p className="loading-user-data">Loading user data</p>
  </div>
    );
  }
  const handleBackdropClick = () => {
  setShowFilters(false);
};


  return (
    <div className="user-bids-wrapper">
      <h2 className="user-bids-title">All Users' {filterType} Bids</h2>

      <div className="user-bids-tabs">
  <button
    className={`user-bids-tab ${filterType === "Bullish" ? "active bullish-active" : ""}`}
    onClick={() => setFilterType("Bullish")}
  >
    Bullish
  </button>
  <button
    className={`user-bids-tab ${filterType === "Bearish" ? "active bearish-active" : ""}`}
    onClick={() => setFilterType("Bearish")}
  >
    Bearish
  </button>
  <button className="user-bids-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
    ⚙ Filters
  </button>
</div>


      {showFilters && (
        <div className="user-bids-filter-container" onClick={handleBackdropClick}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-bids-filter-dropdown">
              <label>Filter by:</label>
              <select value={filterSpecial} className="company-select" onChange={(e) => setFilterSpecial(e.target.value)}>
                <option value="">-- None --</option>
                <option value="BigBull">BigBull / BigBear</option>
              </select>

              {filterSpecial && (
                <>
                  <label>Select Company:</label>
                  <select value={selectedCompany} className="company-select" onChange={(e) => setSelectedCompany(e.target.value)}>
                    <option value="">-- Choose Company --</option>
                    {allCompanies.map((name, idx) => (
                      <option key={idx} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="user-bids-checkbox">
                <input
                  type="checkbox"
                  checked={sortUsers}
                  onChange={(e) => setSortUsers(e.target.checked)}
                />
                Sort Users A–Z
              </label>
              <label className="user-bids-checkbox">
                <input
                  type="checkbox"
                  checked={sortByPoints}
                  onChange={(e) => setSortByPoints(e.target.checked)}
                />
                Sort by Points (High to Low)
              </label>

              <button
                onClick={handleClearFilters}
                disabled={!filterSpecial && !selectedCompany && !sortByPoints && !sortUsers}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}


      {filteredData.map(({ userId, bids }) => {
        const user = users.find((u) => u.userId === userId);

        const filteredBids = bids.filter((bid) => {
          const matchType = bid.dailyBid?.marketName === filterType;

          const matchSpecial =
            !filterSpecial ||
            (filterSpecial === "BigBull" &&
              bid.listBidCompany?.some(
                (c) => c.specialCompany && c.companyName === selectedCompany
              )) ||
            (filterSpecial === "BigBear" &&
              bid.listBidCompany?.some(
                (c) => c.specialCompany && c.companyName === selectedCompany
              ));

          return matchType && matchSpecial;
        });

        if (filteredBids.length === 0) return null;

        return (
          <div key={userId} className="user-bids-user-card">
            <h3 className="user-bids-username">{user?.name || "Unknown User"}</h3>
            <p className="user-bids-bid-count">{filteredBids.length} Bids</p>
            <div className="user-bids-grid">
              {filteredBids.map((bid, index) => (
                <div className="user-bids-card" key={index}>
                  <div className="user-bids-card-header">
                    <BsInfoCircleFill className="user-bids-info-icon" />
                  </div>
                  <div className="user-bids-details">
                    <p className="bid-test-value"><strong>Entry Fee:</strong> {bid.freeBid ? (<><del>₹{bid.paidPoint || "NA"}</del> <span className="user-bids-free">Free</span></>) : <span>₹{bid.paidPoint || "NA"}</span>}</p>
                    <p className="bid-test-value"><strong>Points:</strong> {bid.totalPointCount?.toFixed(2) || "0.00"}</p>
                    <p className="bid-test-value"><strong>Won:</strong> ₹{bid.winningPoint?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="user-bids-companies">
                    <strong>Companies:</strong>
                    <div className="user-bids-company-list">
                      {bid.listBidCompany?.map((company, i) => (
                        <div
                          key={i}
                          className={`company-tag user-bids-company-tag ${
                            company?.specialCompany
                              ? filterType === "Bullish"
                                ? "big-bull-tag"
                                : filterType === "Bearish"
                                ? "big-bear-tag"
                                : ""
                              : ""
                          }`}
                        >
                          <span
                            className={`company-dot user-bids-dot ${
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
        );
      })}
    </div>
  );
};

export default UserBids;