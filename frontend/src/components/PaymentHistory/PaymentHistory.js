import React, { useState, useEffect, useCallback } from 'react';
import './PaymentHistory.css';
import {FaFilter, FaDownload, FaCalendar, FaMoneyBillWave, FaCcVisa, FaCopy, FaForward, FaBackward } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaUser } from 'react-icons/fa';
import logo from './Nifty10-logo-white.png';
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

const PaymentHistory = ({ selectedUser: userId, setActiveTab }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 7;
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedTransactionTypes, setSelectedTransactionTypes] = useState([]);
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId] = useState(userId || localStorage.getItem('selectedUserId'));
// Simulating data loading
   useEffect(() => {
    // Simulate a delay, like fetching user data
    setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds (simulate loading)
    }, 800);
  }, []);

  useEffect(() => {
    let result = transactions;
  
    // Apply filters if selected
    if (selectedTransactionTypes.length > 0) {
      result = result.filter(t => selectedTransactionTypes.includes(t.transactionType));
    }
  
    if (selectedPaymentTypes.length > 0) {
      result = result.filter(t => selectedPaymentTypes.includes(t.paymentType));
    }
  
    // Apply date filter if any
    if (fromDate && toDate) {
      result = result.filter(t => {
        const transactionDate = new Date(t.createdDate);
        return transactionDate >= new Date(fromDate) && transactionDate <= new Date(toDate);
      });
    }
  
    // Apply search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(t =>
        t.transactionHistoryId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transactionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.paymentType?.toLowerCase().includes(searchTerm.toLowerCase())||
        t.transactionAmount?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    setFilteredTransactions(result);
    setCurrentPage(1); // Reset pagination
  }, [transactions, selectedTransactionTypes, selectedPaymentTypes, fromDate, toDate, searchTerm]);
  

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };


const toggleFilterDropdown = () => {
  setFilterDropdownOpen(prev => !prev);
  setCalendarDropdownOpen(false); // close calendar if open
};

const toggleCalendarDropdown = () => {
  setCalendarDropdownOpen(prev => !prev);
  setFilterDropdownOpen(false); // close filter if open
};

const handleFromDateChange = (e) => {
  setFromDate(e.target.value);
};

const handleToDateChange = (e) => {
  setToDate(e.target.value);
};

const applyDateFilter = () => {
  if (!fromDate || !toDate) return;

  const filtered = transactions.filter(t => {
    const transactionDate = new Date(t.createdDate); // Assuming you have `transactionDate` field
    return transactionDate >= new Date(fromDate) && transactionDate <= new Date(toDate);
  });

  setFilteredTransactions(filtered);
  setCalendarDropdownOpen(false); // close dropdown
};


const handleTransactionTypeChange = (type) => {
  setSelectedTransactionTypes(prev =>
    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
  );
};

const handlePaymentTypeChange = (type) => {
  setSelectedPaymentTypes(prev =>
    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
  );
};

const applyFilters = () => {
  let filtered = transactions;

  if (selectedTransactionTypes.length > 0) {
    filtered = filtered.filter(t => selectedTransactionTypes.includes(t.transactionType));
  }
  
  if (selectedPaymentTypes.length > 0) {
    filtered = filtered.filter(t => selectedPaymentTypes.includes(t.paymentType));
  }

  setFilteredTransactions(filtered);
  setFilterDropdownOpen(false); // close after applying
  
};

const fetchTransactions = useCallback(async (startDate, endDate) => {
  try {
    setLoading(true);

    if (!selectedUserId || !startDate || !endDate) {
      setError("User ID and dates are required.");
      return;
    }

const response = await fetch("http://localhost:4000/user/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        userId: selectedUserId
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();
    setTransactions(data?.data || []);
  } catch (error) {
    setError(error.message || "Error fetching transaction history.");
  } finally {
    setLoading(false);
  }
}, [selectedUserId]);


const fetchUsers = useCallback(async () => {
    try {
    setLoading(true);
    setError(null);

    // Make API request to the backend to get user data
    const response = await fetch("http://localhost:4000/users/list");
    const data = await response.json();

    if (data?.content) {
      // Find the user based on the userId
      const foundUser = data.content.find((user) => user.userId === selectedUserId);
      
      if (foundUser) {
        const createdDate = new Date(foundUser.createdDate);
        const today = new Date();
        today.setDate(today.getDate() + 1); // Adds one day to make it tomorrow
        
        // Helper function to format date
        const formatDate = (date) => `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

        const created = formatDate(createdDate);
        const todayFormatted = formatDate(today);

        setUserDetails(foundUser);
        fetchTransactions(created, todayFormatted);
      } else {
        setError("User not found");
      }
    } else {
      setError("Invalid API response");
    }
  } catch (error) {
    setError("Error fetching users. Please try again later.");
  } finally {
    setLoading(false); // Turn off loading spinner
  }
}, [selectedUserId, fetchTransactions]);
useEffect(() => {
  if (selectedUserId) {
    fetchTransactions();
  }

}, [selectedUserId, fetchTransactions]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUsers();
    }
  }, [selectedUserId, fetchUsers]);

  useEffect(() => {
    if (transactions.length > 0) {
      setSelectedTransaction(transactions[0]);
      setFilteredTransactions(transactions);
    }
  }, [transactions]);

  const handleCopy = () => {
    if (selectedTransaction?.transactionHistoryId) {
      navigator.clipboard.writeText(selectedTransaction.transactionHistoryId);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    }
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  if (loading) return (
    <div className="loading-container">
      <p className="loading-user-data">Loading user data</p>
    </div>
  );
  if (error) return <div>{error}</div>;
  if (!transactions) return null;

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

const getPaginationRange = (currentPage, totalPages) => {
  const range = [];
  const maxPages = 5;
  let startPage, endPage;

  if (totalPages <= maxPages) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= 3) {
      startPage = 1;
      endPage = maxPages;
    } else if (currentPage + 2 >= totalPages) {
      startPage = totalPages - maxPages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
};

const handlePageClick = (page) => {
  if (page !== currentPage) {
    setCurrentPage(page);
  }
};


const handleDownloadReport = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
// Setup Dates
  const userName = userDetails?.name || 'User';
  const userEmail = userDetails?.email || 'user@example.com';
const createdDate = new Date(userDetails?.createdDate || Date.now());
  const today = new Date();
  const isFilterApplied = fromDate && toDate;

  const startDate = isFilterApplied ? new Date(fromDate) : createdDate;
  const endDate = isFilterApplied ? new Date(toDate) : today;

  const formattedStartDate = startDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const formattedEndDate = endDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

doc.setFillColor(34, 45, 65); // Dark navy
doc.rect(0, 0, pageWidth, 30, 'F');

// Add logo (optional, on top of background)
doc.addImage(logo, 'PNG', 14, 5, 20, 20); // Adjust Y to fit inside bar

// Set font and white text color
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(255);

// Now add heading text over the dark bar
doc.text('Nifty10 Transaction Report', 40, 20);



  // Generation Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${today.toLocaleString()}`, pageWidth - 10, 8, { align: 'right' });

  // User Info Card
  autoTable(doc, {
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: 10,
      textColor: [50, 50, 50],
      fillColor: [250, 250, 255],
      lineColor: [200, 220, 255],
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [230, 240, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold', textColor: [60, 60, 60] },
    },
    body: [
      ['Name', userName],
      ['Mobile No', userDetails?.mobileNo || '-'],

      ['Email', userEmail],
            ['Wallet Balance', userDetails?.points?.toFixed(2) || '0.00'],
      ['Report Period', `${formattedStartDate} to ${formattedEndDate}`],
    ],
    showHead: 'never',
    margin: { left: 14, right: 14 },
    didParseCell: function (data) {
      if (data.row.index === 3 && data.column.index === 1) {
        data.cell.styles.textColor = [0, 150, 0]; // Green Wallet Balance
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  // Calculate Total Credits, Debits, and Balance
  doc.setFontSize(13);
  doc.setTextColor(34, 45, 65);
  doc.setFont(undefined, 'bold');
  doc.text('Transaction Details', 14, doc.lastAutoTable.finalY + 10);
  let totalCredits = 0;
  let totalDebits = 0;

  // User Info
   const body = filteredTransactions.map(txn => {
    const isCredit = txn.paymentType === 'CREDIT';
    const amountColor = isCredit ? [0, 150, 0] : [200, 0, 0];
    const amountFormatted = txn.transactionAmount.toFixed(2);

    // Sum credits and debits
    if (isCredit) totalCredits += txn.transactionAmount;
    else totalDebits += txn.transactionAmount;

    return [
      new Date(txn.createdDate).toLocaleDateString('en-IN'),
      txn.dayBidCode || '-',
      txn.bidName || '-',
      txn.marketName || '-',
      txn.level?.toString() || '-',
      txn.transactionType || '-',
      txn.paymentType || '-',
      {
        content: amountFormatted,
        styles: {
          textColor: amountColor,
          fontStyle: 'bold',
          halign: 'right',
        },
      },
    ];
  });

  // Table Headers
  const headers = [[
    'Date', 'Bid Code', 'Bid Name', 'Market', 'Level',
    'Type', 'Payment', 'Amount'
  ]];

  // Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    head: headers,
    body,
    styles: {
      fontSize: 9,
      textColor: [40, 40, 40],
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 45, 65],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  });

   const walletBalance = totalCredits - totalDebits;

  // Add Total Credits, Debits, and Wallet Balance Table at the end
  const totals = [
  [
      { content: 'Total Credits' },
      { content: `${totalCredits.toFixed(2)}`, styles: { textColor: [0, 150, 0], fontStyle: 'bold' } }
    ],
    [
      { content: 'Total Debits' },
      { content: `${totalDebits.toFixed(2)}`, styles: { textColor: [200, 0, 0], fontStyle: 'bold' } }
    ]
  ];

  autoTable(doc, {
  
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Total', 'Amount']],
    body: totals,
    styles: {
      fontSize: 9,
      textColor: [0, 0, 0],
      font: 'helvetica',
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [34, 45, 65],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      1: { cellWidth: 35, halign: 'right' },
    },
    tableWidth: 'wrap',
    margin: { left: pageWidth - 84 },
  });
const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
  // Save PDF
const fileName = `${userName}_Transaction_Report_${today.toLocaleDateString('en-IN')}.pdf`;
  doc.save(fileName);
};



  return (filteredTransactions.length > 0 ? filteredTransactions : transactions).length > 0 ? (

    <div className="payment-bg-container">
      <button
        className="profile-back-btn payment-back-btn"
        onClick={() => setActiveTab("profile-card")}
      >
        Back
      </button>
      <div className="profile-header">
              <FaUser className="profile-avatar" />
              <div>
                <h2 className="user-name">{userDetails?.name || "NA"}</h2>
                <p className="user-type">{userDetails?.userType || "NA"}</p>
              </div>
              <div className="user-stats">
                <p>
                  <strong>Total Invested:</strong> ₹
                  {userDetails?.totalInvested?.toFixed(2) || "0.00"}
                </p>
                <p>
                  <strong>Total Won:</strong> ₹
                  {userDetails?.totalWon?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
      <div className="payment-container">
      <div className="left-section">
        <h1>Transaction History</h1>
        {/* <h4 className="transaction-sub-heading">
          Showing transaction history for user: <span className="transaction-user">{userDetails?.name}</span>
        </h4> */}

        <div className="top-bar">
          <input type="text" placeholder="Search Transaction" value={searchTerm} onChange={handleSearch} className="search-input" />
          <div className="btns">
            <button onClick={handleDownloadReport} className="report-btn"><FaDownload /> Download Report</button>
            {/* <button className="black-btn"><FaPlus /> Add Custom Order</button> */}
            <div className="search-icons">
              <div style={{ position: "relative" }}>
                <FaCalendar className="calendar-icon" onClick={toggleCalendarDropdown} />
                {calendarDropdownOpen && !filterDropdownOpen && (
                  <div className="calendar-dropdown">
                    <div className="filter-section date-filter-container">
                      <h4>Select Date Range</h4>
                      <div>
                      <label className="date-filter-label">From Date:</label>
                        <input type="date" value={fromDate} onChange={handleFromDateChange} />
                      </div>
                      <div>
                        <label className="date-filter-label">To Date:</label>
                        <input type="date" value={toDate} onChange={handleToDateChange} />
                      </div>
                      <button className="apply-filter-btn" onClick={applyDateFilter}>Apply Date Filter</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <FaFilter className="filter-icon" onClick={toggleFilterDropdown} />

                {filterDropdownOpen && !calendarDropdownOpen && (
                  <div className="filter-dropdown">
                    <div className="filter-section">
                      <h4>Transaction Type</h4>
                      {["WINNING_AMOUNT", "BID_AMOUNT", "DEPOSIT", "REFUND", "BONUS"].map((type) => (
                        <div key={type}>
                          <input
                            type="checkbox"
                            checked={selectedTransactionTypes.includes(type)}
                            onChange={() => handleTransactionTypeChange(type)}
                          /> {type}
                        </div>
                      ))}
                    </div>
                    <div className="filter-section">
                      <h4>Payment Type</h4>
                      {["CREDIT", "DEBIT"].map((type) => (
                        <div key={type}>
                          <input
                            type="checkbox"
                            checked={selectedPaymentTypes.includes(type)}
                            onChange={() => handlePaymentTypeChange(type)}
                          /> {type}
                        </div>
                      ))}
                    </div>
                    <button className="apply-filter-btn" onClick={applyFilters}>Apply Filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <table className="order-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
          {filteredTransactions.slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage).map((transaction, index) => (

              <tr
                key={index}
                onClick={() => handleTransactionClick(transaction)}
                style={{ cursor: "pointer" }}
                className={selectedTransaction?.transactionHistoryId === transaction.transactionHistoryId ? 'selected-row' : ''}
              >
                <td><FaMoneyBillWave className="icon" /> {transaction.transactionType}<span className="code">#{transaction.transactionHistoryId?.substring(0, 5).toUpperCase()}</span></td>
                <td className="amount">₹ {transaction.transactionAmount?.toFixed(2)}</td>
                <td className={transaction.paymentType === "CREDIT" ? "credit" : "debit"}>
                  {transaction.paymentType}
                </td>

                <td>
                  {(() => {
                    const date = new Date(transaction.createdDate);
                    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                  })()}
                </td>
                <td className={transaction.transactionStatus === 'SUCCESS' ? 'success' : 'failed'}>
                  {transaction.transactionStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * transactionsPerPage + 1}–{Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} from {filteredTransactions.length}
          </div>

          <div className="pages">
            {currentPage > 1 && (
              <>
                <span className="pagination-arrow" onClick={() => handlePageClick(1)}><FaBackward /></span> {/* Go to First Page */}
                <span className="pagination-arrow" onClick={() => handlePageClick(currentPage - 1)}>&lt;</span> {/* Previous */}
              </>
            )}

            {getPaginationRange(currentPage, totalPages).map((page, index) => (
              <span
                key={index}
                className={currentPage === page ? "active-page" : ""}
                onClick={() => handlePageClick(page)}
                style={{ cursor: "pointer" }}
              >
                {page}
              </span>
            ))}

            {currentPage < totalPages && (
              <>
                <span className="pagination-arrow" onClick={() => handlePageClick(currentPage + 1)}>&gt;</span> {/* Next */}
                <span className="pagination-arrow" onClick={() => handlePageClick(totalPages)}><FaForward /></span> {/* Go to Last Page */}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="right-section">
        {/* Here Invested money card should be added for the paticular user from profilecard */}
        <div className="profile-section">
            <h3>Statistics</h3>
            <div className="statistics-container">
              <Card
                key={1}
                title="INVESTED MONEY"
                icon="./rupee-symbol.png"
                color="Bullish"
                data={`₹${
                  userDetails?.investedMoney
                    ? userDetails.investedMoney.toFixed(2)
                    : "0.00"
                }`}
              />
              <Card
                key={2}
                title="WALLET"
                icon="./rupee-wallet.png"
                color="Bearish"
                data={`₹${
                  userDetails?.points ? userDetails.points.toFixed(2) : "0.00"
                }`}
              />
            </div>
          </div>
        {selectedTransaction && (
          <div className="details-card">
            <div className="header">
              <FaMoneyBillWave className="icon" />
              <span className={selectedTransaction.transactionStatus === "SUCCESS" ? "success" : "failed"}>
                {selectedTransaction.transactionStatus}
              </span>
            </div>

            <div className="section">
              <details open>
                <summary><h3>Transaction Details</h3></summary>
                <hr className="horizontalLine" />
                <div className="transaction-details">
                  <h4>Transaction ID</h4>
                  <h5 className="code purple transaction-id" onClick={handleCopy}>
                    <FaCopy className="copy-icon" /> {selectedTransaction.transactionHistoryId}
                  </h5>
                </div>
                <div className="transaction-details">
                  <h4>Transaction Date</h4>
                  <h5 className="gray">
                    {(() => {
                      const date = new Date(selectedTransaction.createdDate);
                      const day = String(date.getUTCDate()).padStart(2, '0');
                      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                      const year = date.getUTCFullYear();
                      const hours = String(date.getUTCHours()).padStart(2, '0');
                      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                      const seconds = String(date.getUTCSeconds()).padStart(2, '0');

                      return` ${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
                    })()}
                  </h5>
                </div>
              </details>
            </div>

            {showPopup && <div className="popup">ID Copied!</div>}

            <div className="section">
            <details open>
              <summary><h3>Transaction Timeline</h3></summary>
              <hr className="horizontalLine" />
              <ul className="timeline">
                <li>
                  <h2 className="dot purple-dot"> </h2> 
                  {new Date(selectedTransaction.createdDate).toLocaleDateString('en-GB')} <br />
                  <span className='timeline-text'>
                    {selectedTransaction.transactionStatus === 'SUCCESS' 
                      ? 'Transaction Successful'
                      : 'Transaction Failed / Pending'}
                  </span>
                </li>
                <li>
                  <span className="dot purple-dot" />
                  Payment Type: <span className={selectedTransaction.paymentType === "CREDIT" ? "credit" : "debit"}>{selectedTransaction.paymentType}</span> <br />
                  <span className='timeline-text'>
                    {selectedTransaction.paymentType === 'CREDIT' 
                      ? 'Balance added to wallet'
                      : 'Amount debited from wallet'}
                  </span>
                </li>
                <li>
                  <span className="dot purple-dot" />
                  Transaction Type: {selectedTransaction.transactionType} <br />
                  <span className='timeline-text'>
                    {selectedTransaction.transactionType === 'BID_AMOUNT'
                      ? 'Bid related transaction'
                      : selectedTransaction.transactionType === 'WINNING_AMOUNT'
                      ? 'Winning related transaction'
                      : selectedTransaction.transactionType === 'DEPOSIT'
                      ? 'Deposit related transaction'
                      : 'Other transaction'}
                  </span>

                </li>
              </ul>
            </details>
          </div>
            <div className="section">
              <details open>
                <summary><h3>Payment Details</h3></summary>
                <hr className="horizontalLine" />
                <div className="transaction-details">
                  <h4>Payment Type</h4>
                  <h5 className={selectedTransaction.paymentType === "CREDIT" ? "credit" : "debit"}><FaCcVisa className="visa" /> {selectedTransaction.paymentType}</h5>
                </div>
                <div className="transaction-details">
                  <h4>Transaction Type</h4>
                  <h5 className="gray">{selectedTransaction.transactionType}</h5>
                </div>
                <div className="transaction-details">
                  <h4>Total Price</h4>
                  <h5 className="gray amount">₹ {selectedTransaction.transactionAmount?.toFixed(2)}</h5>
                </div>
                <hr className="horizontalLine" />
                <h5 className="total">Total <span className="amount">₹ {selectedTransaction.transactionAmount?.toFixed(2)}</span></h5>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  ) : (
    <div>No transaction history available.</div>
  );
};

export default PaymentHistory;