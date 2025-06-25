import React, { useEffect, useState } from "react";
import "./UsersInfo.css";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
const UsersInfo = ({ setActiveTab, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsersData, setDisplayedUsersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extraContent, setExtraContent] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [newUsers, setNewUsers] = useState([]);


  // Show 20 users per page
  const usersPerPage = 30;
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem("usersPage");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // … rest of your state hooks …

  // 2. Persist page whenever it changes
  useEffect(() => {
    localStorage.setItem("usersPage", currentPage);
  }, [currentPage]);

  // 3. In handleUserClick, no extra work needed for page—the effect takes care of it
  const handleUserClick = (user) => {
    setSelectedUser(user);
    localStorage.setItem("selectedUser", JSON.stringify(user));
    setActiveTab("profile-card");
  };



  // Fetch Users
const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await fetch(
      "https://prod-api.nifty10.com/nif/user/list/user?size=1000"
    );
    const data = await response.json();

    if (data?.data?.content) {
      const allUsers = data.data.content;
      setUsers(allUsers);
      setFilteredUsers(allUsers);

      // ✅ Check if View More was clicked
      if (localStorage.getItem("showExtraUsersInfo") === "true") {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const newUserList = allUsers
          .filter(user => new Date(user.createdDate) >= last24Hours)
          .map(user => {
            const referrer = allUsers.find(
              u => u.referralCode === user.referredBy
            );
            return {
              ...user,
              referredByName: referrer?.name || "NA",
            };
          });

        setNewUsers(newUserList);
        setShowExtra(true);
      }
    } else {
      setError("Invalid API response");
    }
  } catch (error) {
    setError("Error fetching users. Please try again later.");
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter by search and date
  // Filter by search and date + reset pagination
  useEffect(() => {
    let updatedUsers = users.filter((user) => user.userType === "CUSTOMER");

    // Search filter
    if (searchQuery) {
      updatedUsers = updatedUsers.filter(
        (user) =>
          (user.name &&
            user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.email &&
            user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.mobileNo &&
            String(user.mobileNo)
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

    // Date filter
    if (filterDate) {
      updatedUsers = updatedUsers.filter((user) => {
        if (user.createdDate) {
          const userDate = new Date(user.createdDate)
            .toISOString()
            .split("T")[0];
          return userDate === filterDate;
        }
        return false;
      });
    }

    setFilteredUsers(updatedUsers);
  }, [users, searchQuery, filterDate]);


  // Sort only the current page's slice
  useEffect(() => {
    const startIndex = currentPage * usersPerPage;
    let currentPageUsers = filteredUsers.slice(
      startIndex,
      startIndex + usersPerPage
    );

    if (sortField) {
      currentPageUsers.sort((a, b) => {
        let fieldA = a[sortField] || "";
        let fieldB = b[sortField] || "";

        if (sortField === "name") {
          fieldA = String(fieldA).toLowerCase();
          fieldB = String(fieldB).toLowerCase();
        } else if (sortField === "createdDate") {
          fieldA = new Date(a.createdDate).getTime();
          fieldB = new Date(b.createdDate).getTime();
        } else {
          // numeric fields: investedMoney, points, etc.
          fieldA = Number(fieldA);
          fieldB = Number(fieldB);
        }

        if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    setDisplayedUsersData(currentPageUsers);
  }, [filteredUsers, currentPage, sortField, sortOrder]);

  // Sorting handler
  const handleSort = (field) => {
    let order = "asc";
    if (sortField === field && sortOrder === "asc") {
      order = "desc";
    }
    setSortField(field);
    setSortOrder(order);
    // We don't reset current page
  };

  // Change Active Status
  const changeActiveStatus = async (id, name, prevStatus) => {
    try {
      const newStatus = !prevStatus;
      const response = await axios.post(
        "https://prod-erp.nifty10.in/user/updateUser",
        { userId: id, name: name, isActive: newStatus },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Active Status changed successfully!");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userId === id
              ? { ...user, name: user.name || name, isActive: newStatus }
              : user
          )
        );
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error changing status. Please try again.");
    }
  };

  const onClickStatus = (id, name, prevStatus) => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: "Are you sure?",
        text: "You want to change the Active Status",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          changeActiveStatus(id, name, prevStatus);
          swalWithBootstrapButtons.fire({
            title: "Changed!",
            text: "Active Status changed Successfully",
            icon: "success",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Active Status not changed!",
            icon: "error",
          });
        }
      });
  };

  // Pagination info
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = currentPage * usersPerPage;
  const endIndex = startIndex + displayedUsersData.length;

  return (
    <div className="users-info__container">
      <ToastContainer position="top-right" style={{ marginTop: "65px" }} />

      {/* FIRST ROW: "Users List" header on the left, Pagination on the right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT: Users List header */}
        <h2 className="users-info__title" style={{ margin: 0 }}>
          Users List
        </h2>

        {/* RIGHT: Gmail-like pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            fontWeight: "bold",
          }}
        >
          {filteredUsers.length === 0
            ? "0-0 of 0"
            : `${startIndex + 1}-${endIndex} of ${filteredUsers.length}`}

          {/* Left Arrow */}
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            style={{
              fontSize: "1rem",
              padding: "4px 8px",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
            }}
          >
            {"<"}
          </button>

          {/* Right Arrow */}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
            }
            disabled={currentPage >= totalPages - 1}
            style={{
              fontSize: "1rem",
              padding: "4px 8px",
              cursor:
                currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
            }}
          >
            {">"}
          </button>
        </div>
      </div>

      {/* SECOND ROW: Search + Date filter */}
      <div
        className="users-search-wrapper"
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          alignItems: "center",    // keep things vertically centered
        }}
      >
        <div className="users-search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="users-search-input"
            placeholder="Search by Name, Email, or Mobile Number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);   // reset only when user types a new query
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginLeft: "auto",   // <-- pushes this whole block to the right
          }}
        >
          <label htmlFor="dateFilter">Date:</label>
          <input
            id="dateFilter"
            type="date"
            className="users-search-input"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(0);   // reset only when user picks a new date
            }}
            style={{ maxWidth: "200px" }}
          />
        </div>
      </div>
      {showExtra && (
  <div className="new-users-container">
    <h3 className="new-users-header">🆕 New Users in the Last 24 Hours: {newUsers.length}</h3>
    {/* <div className="new-users-carousel">
      <div className="new-users-track">
        {newUsers.map((user, index) => (
          <div className="new-user-card" key={index}>
            <p><strong>Name:</strong> {user.name || "N/A"}</p>
            <p><strong>Email:</strong> {user.email || "N/A"}</p>
            <p><strong>Mobile:</strong> {user.mobileNo || "N/A"}</p>
            <p><strong>Referred By:</strong> {user.referredByName}</p>
            <button
              className="show-more-btn"
              onClick={() => {
                setSelectedUser(user);
                setActiveTab("profile-card");
              }}
            >
              Show More →
            </button>
          </div>
        ))}
      </div>
    </div> */}
  </div>
)}



      {/* TABLE */}
      <div className="users-info__table-wrapper" style={{ marginTop: "1rem" }}>
        {loading ? (
          <div className="users-info__loading">Loading users...</div>
        ) : error ? (
          <div className="users-info__error">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-info__error">Sorry, no data found..!</div>
        ) : (
          <table className="users-info__table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>
                  Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th>Mobile No</th>
                <th style={{ textAlign: "center" }}>Email</th>
                <th onClick={() => handleSort("createdDate")}>
                  Created Date{" "}
                  {sortField === "createdDate" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("investedMoney")}>
                  Invested Money{" "}
                  {sortField === "investedMoney" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("points")}>
                  Wallet{" "}
                  {sortField === "points" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th>Earned Money</th>
                <th>Is Active</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsersData.map((user, index) => (
                <tr key={index} onClick={() => handleUserClick(user)} style={{ cursor: "pointer" }} className="users-info__row">
                  <td className="users-info__name" title={user.name}>{user.name || "N/A"}</td>
                  <td>{user.mobileNo || "N/A"}</td>
                  <td>{user.email || "N/A"}</td>
                  <td>
                    {user.createdDate
                      ? new Date(user.createdDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    ₹
                    {user.investedMoney
                      ? user.investedMoney.toLocaleString("en-IN")
                      : "0"}
                  </td>
                  <td>
                    {user.points !== null && user.points !== undefined
                      ? user.points.toFixed(2)
                      : "0.00"}
                  </td>
                  <td>
                    ₹
                    {user.earnedMoney
                      ? user.earnedMoney.toLocaleString("en-IN")
                      : "0"}
                  </td>
                  <td
                    onClick={() =>
                      onClickStatus(user.userId, user.name, user.isActive)
                    }
                    className="users-info__status"
                  >
                    {user.isActive ? "✅ Active" : "❌ Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div
          style={{
            marginTop: "20px",
            marginLeft: "85%",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            fontWeight: "bold",
          }}
        >
          {filteredUsers.length === 0
            ? "0-0 of 0"
            : `${startIndex + 1}-${endIndex} of ${filteredUsers.length}`}

          {/* Left Arrow */}
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            style={{
              fontSize: "1rem",
              padding: "4px 8px",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
            }}
          >
            {"<"}
          </button>

          {/* Right Arrow */}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
            }
            disabled={currentPage >= totalPages - 1}
            style={{
              fontSize: "1rem",
              padding: "4px 8px",
              cursor:
                currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
            }}
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersInfo;