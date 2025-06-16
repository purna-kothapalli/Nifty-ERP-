import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HolidayConfig.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HolidayConfig = () => {
  const [holidayName, setHolidayName] = useState("");
  const [holidayDays, setHolidayDays] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const response = await axios.get("https://dev-erp.nifty10.in/bids/holidays");
      setHolidays(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch holidays.");
      toast.error("Error fetching data.!");
    }
  };


  const updateToDate = (start, days) => {
    if (!start || !days || days < 1) return;
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() + parseInt(days) - 1);
    setToDate(startDate.toISOString().split("T")[0]);
  };

  const handleHolidayDaysChange = (e) => {
    const days = e.target.value;
    setHolidayDays(days);
    if (!fromDate) {
      const today = new Date().toISOString().split("T")[0];
      setFromDate(today);
      updateToDate(today, days);
    } else {
      updateToDate(fromDate, days);
    }
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    updateToDate(newFromDate, holidayDays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!holidayName || !fromDate || !toDate) {
      setError("Please fill in all the fields.");
      return;
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (endDate < startDate) {
      setError("To Date cannot be earlier than From Date.");
      return;
    }

    let currentDate = new Date(startDate);
    let failedRequests = 0;

    while (currentDate <= endDate) {
      const formattedDate = currentDate
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join("-"); // Convert to DD-MM-YYYY

      try {
        await axios.post("https://dev-erp.nifty10.in/bids/holiday/configuration", {
          date: formattedDate,
          name: holidayName,
        });
        toast.success("Holiday added successfully!", { position: "top-right" });
      } catch (err) {
        failedRequests++;
        toast.error("Error adding holiday.");
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (failedRequests === 0) {
      fetchHolidays();
      setHolidayName("");
      setFromDate("");
      setToDate("");
      setHolidayDays("");
      setError(null);
    } else {
      setError("Some holidays failed to be added. Please try again.");
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // Converts to DD-MM-YYYY
  };

  const filteredHolidays = holidays.filter((holiday) => {
    const date = new Date(holiday.holidayDate);
    const monthMatches = selectedMonth ? date.getMonth() + 1 === parseInt(selectedMonth) : true;
    const yearMatches = selectedYear ? date.getFullYear() === parseInt(selectedYear) : true;
    return monthMatches && yearMatches;
  });

  // Get today's date in YYYY-MM-DD format for the min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="uni-bid-form-container holiday-conif">
      <h2 className="uni-form-heading">Holiday Configuration</h2>
      <ToastContainer position="top-right" style={{ marginTop: "65px" }} />
      <form onSubmit={handleSubmit} className="uni-bid-form-grid">
        <div className="uni-form-group">
          <label>Holiday Name:</label>
          <input
            type="text"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            placeholder="Enter holiday name"
            required
          />
        </div>

        <div className="uni-form-group">
          <label>No. of Holidays:</label>
          <input
            type="number"
            min="1"
            value={holidayDays}
            onChange={handleHolidayDaysChange}
            required
          />
        </div>

        <div className="uni-form-group">
          <label>From Date:</label>
          <input
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            required
            min={todayDate}  // Prevent selection of past dates
          />
        </div>

        <div className="uni-form-group">
          <label>To Date:</label>
          <input
            type="date"
            value={toDate}
            readOnly
          />
        </div>

        <div className="uni-form-group holiday-btn-container" style={{ gridColumn: "1 / span 2", textAlign: "right" }}>
          <button type="submit" className="holiday-submit-button">Add Holiday</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="uni-holiday-list">
        <h3 className="uni-form-heading">Holiday List</h3>
        <div className="sort-options">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">All Months</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("en", { month: "long" })}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">All Years</option>
            {[...new Set(holidays.map((h) => new Date(h.holidayDate).getFullYear()))].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="table-container holiday-config-table">
          <table className="admin-table holidays-table">
            <thead>
              <tr>
                <th>Sl. No</th>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Active</th>
              </tr>
            </thead>
          </table>
          <div className="holiday-table">
            <table className="admin-table">
              <tbody>
                {filteredHolidays.length > 0 ? (
                  filteredHolidays.map((holiday, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{holiday.name}</td>
                      <td>{formatDate(holiday.holidayDate)}</td>
                      <td>{holiday.active ? "✅ Active" : "❌ Inactive"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">No holidays found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayConfig;