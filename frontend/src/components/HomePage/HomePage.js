import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import Company from "../Company/Company";
import MarketStatus from "../MarketStatus/MarketStatus";
import UsersInfo from "../UsersInfo/UsersInfo";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { toast } from "react-toastify";
import Results from "../Results/Results";
import AllMarkets from "../AllMarkets/AllMarkets";
import Dashboard from "../Dashboard/Dashboard";
import BidsCreation from "../BidsCreation/BidsCreation";
import axios from "axios";
import HolidayConfig from "../HolidayConfig/HolidayConfig";
import ProfileCard from "../ProfileCard/ProfileCard";
import BidsConfigure from "../BidsConfigure/BidsConfigure";
import PaymentHistory from "../PaymentHistory/PaymentHistory";
import UserBids from "../UserBids/UserBids";
import SmsForm from "../SmsForm/SmsForm";
const HomePage = () => {
  // ─── State ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMsgDropdownOpen, setIsMsgDropdownOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const dropdownsRef = useRef(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState(""); // "Notification" | "Message" | "Announcement"
  const [formData, setFormData] = useState({
    notification: "",
    active: true,
    id: null,
  });
  const [selectedUser, setSelectedUser] = useState(() => {
    const storedUser = localStorage.getItem("selectedUser");
    return storedUser ? JSON.parse(storedUser) : null; // Load from localStorage
  });
  const [showNewNotifForm, setShowNewNotifForm] = useState(false);
  const [newNotif, setNewNotif] = useState({ body: '', title: '' });
  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const announcementRef = useRef(null);
  const settingsRef = useRef(null);

  // ─── Submenu toggle for Bids Creation ─────────────────────────────────
  const [isBidsSubmenuOpen, setIsBidsSubmenuOpen] = useState(
    localStorage.getItem("isBidsSubmenuOpen") === "true"
  );
  useEffect(() => {
    localStorage.setItem("isBidsSubmenuOpen", isBidsSubmenuOpen);
  }, [isBidsSubmenuOpen]);
  const toggleBidsSubmenu = () => setIsBidsSubmenuOpen(open => !open);

  // ─── Persist activeTab ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // ─── Handle window resize ─────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsCollapsed(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Fetch notifications/messages/announcements ────────────────────────
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("http://localhost:4000/get/notifications");
      const allData = response.data.data || [];

      const formatTS = (ts) => {
        const d = new Date(ts);
        return (
          d.toLocaleDateString("en-GB") +
          " " +
          d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      };

      setNotifications(
        allData
          .filter((n) => n.title === "Notification")
          .map((n) => ({ ...n, formattedTimestamp: formatTS(n.createdTimestamp) }))
      );

      setMessages(
        allData
          .filter((n) => n.title === "Message")
          .map((n) => ({ ...n, formattedTimestamp: formatTS(n.createdTimestamp) }))
      );

      setAnnouncements(
        allData
          .filter((n) => n.title === "Announcement")
          .map((n) => ({ ...n, formattedTimestamp: formatTS(n.createdTimestamp) }))
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideNotification =
        notificationRef.current && !notificationRef.current.contains(event.target);
      const isOutsideMessage =
        messageRef.current && !messageRef.current.contains(event.target);
      const isOutsideAnnouncement =
        announcementRef.current && !announcementRef.current.contains(event.target);

      if (isOutsideNotification && isOutsideMessage && isOutsideAnnouncement) {
        setIsDropdownOpen(false);
        setIsMsgDropdownOpen(false);
        setIsAnnouncementOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // ─── Authentication check ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const otp = localStorage.getItem("isOtpVerfied");
    if (!otp) {
      toast.error("You need to Verify Otp!", { position: "top-center" });
      navigate("/otp");
      return;
    }
    if (token && otp) {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // ─── Dropdown toggles ─────────────────────────────────────────────────
  const toggleNotificationDropdown = () => {
    setIsDropdownOpen((p) => !p);
    setIsMsgDropdownOpen(false);
    setIsAnnouncementOpen(false);
    setIsSettingsOpen(false);
  };
  const toggleMsgDropdown = () => {
    setIsMsgDropdownOpen((p) => !p);
    setIsDropdownOpen(false);
    setIsAnnouncementOpen(false);
    setIsSettingsOpen(false);
  };
  const toggleAnnouncement = () => {
    setIsAnnouncementOpen((p) => !p);
    setIsDropdownOpen(false);
    setIsMsgDropdownOpen(false);
    setIsSettingsOpen(false);
  };
  const toggleSettingsDropdown = () => {
    setIsSettingsOpen((p) => !p);
    setIsDropdownOpen(false);
    setIsMsgDropdownOpen(false);
    setIsAnnouncementOpen(false);
  };

  // ─── Modal open/close ─────────────────────────────────────────────────
  const openAddModal = (type) => {
    setAddType(type);
    setFormData({ notification: "", active: true, id: null });
    setIsAddModalOpen(true);
    setIsDropdownOpen(false);
  setIsMsgDropdownOpen(false);
  setIsAnnouncementOpen(false);
  setIsSettingsOpen(false);
  setIsAddModalOpen(true);  
  };
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormData((f) => ({ ...f, id: null }));
  };


  // ─── Form handlers ────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewNotifSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/api/notifications/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif),
      });
      const result = await response.json();

      if (result.success) {
        alert('Notification posted!');
        setNewNotif({ body: '', title: '' });
        setShowNewNotifForm(false);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
    console.log("🔥 Payload being sent:", newNotif);
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: addType,
      notification: formData.notification,
      active: formData.active,
      // include id only if editing
      ...(formData.id && { id: formData.id }),
    };

    try {
      await axios.post("http://localhost:4000/post/notification", payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success(
        `${addType} ${formData.id ? "updated" : "added"} successfully!`,
        { position: "top-center" }
      );
      closeAddModal();
      fetchNotifications();
    } catch (err) {
      console.error(err);
      toast.error(
        `Failed to ${formData.id ? "update" : "add"} ${addType}.`,
        { position: "top-center" }
      );
    }
  };
  const handleEditNotification = (notif) => {
    setAddType("Notification");
    setFormData({
      notification: notif.notification,
      active: notif.active,
      id: notif.id,
    });
    setIsDropdownOpen(false);
 setIsAddModalOpen(true);
  };
  const handleEditMessage = (msg) => {
    setAddType("Message");
    setFormData({
      notification: msg.notification,
      active: msg.active,
      id: msg.id,
    });
setIsMsgDropdownOpen(false);
 setIsAddModalOpen(true);
  };

  // click ✏️ next to an Announcement
  const handleEditAnnouncement = (ann) => {
    setAddType("Announcement");
    setFormData({
      notification: ann.notification,
      active: ann.active,
      id: ann.id,
    });
 setIsAnnouncementOpen(false);
 setIsAddModalOpen(true);
  };
  // ─── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("isOtpVerfied");
    window.location.href = "/login";
  };
  const formatTS = (utcTimestamp) => {
    const date = new Date(utcTimestamp);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };


  // ─── Unread counts ─────────────────────────────────────────────────────
  const NotificationUnreadCount = notifications.filter((n) => n.active).length;
  const MsgUnreadCount = messages.filter((m) => m.active).length;
  const AnnouncementUnreadCount = announcements.filter((a) => a.active).length;

  // ─── Tab content renderer ─────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "markets":
        return <AllMarkets />;
      case "companies":
        return <Company />;
      case "market-status":
        return <MarketStatus />;
      case "users-info":
        return <UsersInfo setActiveTab={setActiveTab} setSelectedUser={setSelectedUser} />;
      case "results":
        return <Results />;
      case "bids-creation":
        return <BidsCreation />;
      case "holiday-config":
        return <HolidayConfig />;
      case "profile-card":
        return <ProfileCard selectedUser={selectedUser?.userId} setActiveTab={setActiveTab} />;
      case "bids-create":
        return <BidsCreation />;
      case "payment-history":
        return <PaymentHistory selectedUser={selectedUser?.userId} setActiveTab={setActiveTab} />;
      case "bids-configure":
        return <BidsConfigure />;
      case "user-bids":
        return <UserBids />;
      case "sms-form":
        return <SmsForm />;
      default:
        return <Dashboard />; // Default to Dashboard if no tab is selected
    }
  };


  return (
    <>
      {/* ─── Add Modal ─────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{formData.id ? "Edit" : "Add"} {addType}</h2>

            <form onSubmit={handleFormSubmit}>
              {/* Hidden ID */}
              <input
                type="hidden"
                name="id"
                value={formData.id || ""}
              />

              <div className="not-form-group">
                <label>Notification Text</label>
                <textarea
                  name="notification"
                  value={formData.notification}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="not-form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleFormChange}
                  />{" "}
                  Active
                </label>
              </div>

              <div className="not-form-actions">
                <button type="button" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ─── Layout ───────────────────────────────────────────────────────────── */}
      <div className={`app-container ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
        {/* Sidebar */}
        <div className={`sidebar ${isCollapsed ? "collapsed" : "expanded"}`}>
          <div className="sidebar-header">
            <img
              src="Nifty10-logo.png"
              alt="logo"
              className="logo"
              onClick={() => setIsCollapsed((prev) => !prev)}
            />
            {!isCollapsed && <span className="visible">Nifty10</span>}
          </div>
          <div className="sidebar-menu">
            <ul>
              <li
                onClick={() => setActiveTab("dashboard")}
                className={activeTab === "dashboard" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fa-solid fa-user-tie"></i>
                  {!isCollapsed && <span className="visible">Dashboard</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("markets")}
                className={activeTab === "markets" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fas fa-chart-line"></i>
                  {!isCollapsed && <span className="visible">All Markets</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("companies")}
                className={activeTab === "companies" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fas fa-building"></i>
                  {!isCollapsed && <span className="visible">All Companies</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("holiday-config")}
                className={activeTab === "holiday-config" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fa-solid fa-calendar-check"></i>
                  {!isCollapsed && <span className="visible">Holiday Config</span>}
                </Link>
              </li>
              <li className={activeTab.startsWith("bids-creation") ? "active has-submenu" : "has-submenu"}>
                <div
                  className="submenu-toggle"
                  onClick={toggleBidsSubmenu}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-clipboard"></i>
                  {!isCollapsed && <span className="visible">Bids Configure</span>}
                  {!isCollapsed && (
                    <i
                      className={`fa-solid fa-chevron-${isBidsSubmenuOpen ? "down" : "right"} submenu-arrow`}
                    ></i>
                  )}
                </div>
                {isBidsSubmenuOpen && (
                  <ul className="submenu">
                    <li
                      className={activeTab === "bids-create" ? "active" : ""}
                      onClick={() => setActiveTab("bids-create")}
                    >
                      Create
                    </li>
                    <li
                      className={activeTab === "bids-configure" ? "active" : ""}
                      onClick={() => setActiveTab("bids-configure")}
                    >
                      Configure
                    </li>
                  </ul>
                )}
              </li>

              <li
                onClick={() => setActiveTab("market-status")}
                className={activeTab === "market-status" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fas fa-folder-open"></i>
                  {!isCollapsed && <span className="visible">Market Status</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("results")}
                className={activeTab === "results" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fas fa-clock"></i>
                  {!isCollapsed && <span className="visible">Results</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("users-info")}
                className={activeTab === "users-info" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fas fa-users"></i>
                  {!isCollapsed && <span className="visible">Users Info</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("admin-settings")}
                className={activeTab === "admin-settings" ? "active admin-settings" : "admin-settings"}
              >
                <Link to="#">
                  <i className="fa-solid fa-user-gear settings-icon"></i>
                  {!isCollapsed && <span className="visible">Admin</span>}
                </Link>
              </li>
              <li
                onClick={() => setActiveTab("user-bids")}
                className={activeTab === "user-bids" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fa-solid fa-user-secret"></i>
                  {!isCollapsed && <span className="visible">user Bids</span>}
                </Link>
              </li>
              {/* <li
                onClick={() => setActiveTab("sms-form")}
                className={activeTab === "sms-form" ? "active" : ""}
              >
                <Link to="#">
                  <i className="fa-solid fa-user-secret"></i>
                  {!isCollapsed && <span className="visible">Sms form</span>}
                </Link>
              </li> */}
            </ul>
          </div>
        </div>

        {/* Mobile Header */}
        <div id="mobile-header" className="mobile-header">
          <header id="header" className="header">
            <div className="search-wrapper">
              <div className="social-icons">
                <img
                  src="Nifty10-logo.png"
                  alt="logo"
                  className="logo"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                />
                <div className="notification-wrapper">
                  {/* Announcement */}
                  <div ref={announcementRef}>
                    <i className="fas fa-megaphone" onClick={toggleAnnouncement}>
                      <img src="/megaphone.png" alt="megaphone" className="social-icon-megaphone" />
                      {AnnouncementUnreadCount > 0 && (
                        <span className="notification-count">{AnnouncementUnreadCount}</span>
                      )}
                    </i>
                    {isAnnouncementOpen && (
                      <div className="announcement-popup">

                        <button className="close-btn" onClick={() => setIsAnnouncementOpen(false)}>
                          ✖
                        </button>
                        <div className="announcement-text-wrapper">
                          <div className="announcement-icon-wrapper">
                            <img src="/megaphone.png" alt="megaphone" className="announcement-icon" />
                            <div className="waves"></div>
                          </div>
                          <button onClick={() => openAddModal("Announcement")} className="not-add-btn">
                            + Add Announcement
                          </button>
                          {announcements.filter((a) => a.active).length > 0 ? (
                            <ul className="announcement-list">
                              {announcements
                                .filter((a) => a.active)
                                .map((a) => (
                                  <li
                                    key={a.id} className="announcement-text"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleEditAnnouncement(a)}
                                  >
                                    {a.notification}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="no-notifications">No new announcements</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Messages */}
                  <div ref={messageRef}>
                    <i className="fas fa-envelope" onClick={toggleMsgDropdown}>
                      {MsgUnreadCount > 0 && <span className="notification-count">{MsgUnreadCount}</span>}
                    </i>
                    {isMsgDropdownOpen && (
                      <div className="notification-dropdown msg-dropdown">
                        <button onClick={() => openAddModal("Message")} className="not-add-btn">
                          + Add Message
                        </button>

                        {messages.filter((m) => m.active).length > 0 ? (
                          messages
                            .filter((m) => m.active)
                            .map((m) => (
                              <div
                                key={m.id}
                                className="notification-item"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleEditMessage(m)}
                              >    <p>{m.notification}</p>
                                <span className="timestamp">{m.formattedTimestamp}</span>
                              </div>
                            ))
                        ) : (
                          <p className="no-notifications">No new messages</p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Notifications */}
                  <div ref={notificationRef}>
                    <i className="fas fa-bell" onClick={toggleNotificationDropdown}>
                      {NotificationUnreadCount > 0 && (
                        <span className="notification-count">{NotificationUnreadCount}</span>
                      )}
                    </i>

                    {isDropdownOpen && (
                      <div className="notification-dropdown">
                        <div className="Notification-control">
                          <button onClick={() => openAddModal("Notification")} className="not-add-btn">
                            + Add Notification
                          </button>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={showNewNotifForm}
                              onChange={() => {setShowNewNotifForm(prev => !prev);
                                setIsDropdownOpen(false);
                              }}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        {notifications.filter((n) => n.active).length > 0 ? (
                          notifications
                            .filter((n) => n.active)
                            .map((n) => (
                              <div
                                key={n.id}
                                className="notification-item read"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleEditNotification(n)}
                              >
                                <p>{n.notification}</p>
                                <span className="timestamp">{n.formattedTimestamp}</span>
                              </div>
                            ))
                        ) : (
                          <p className="no-notifications">No new notifications</p>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Settings */}
                  <i
                    className={`fa-solid fa-user-gear settings-icon ${isSettingsOpen ? "rotate" : ""
                      }`}
                    onClick={toggleSettingsDropdown}
                  ></i>
                  {isSettingsOpen && (
                    <div className="settings-dropdown">
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Desktop Header */}
        <div id="mainContent" className="main-content">
          <header
            id="headerContent"
            className={`header-content ${isCollapsed ? "collapsed-header-content" : "expanded-header-content"
              }`}
          >
            <div className="search-wrapper">
              <div className="social-icons">
                <div className="notification-wrapper">
                  {/* Announcement */}
                  <i className="fas fa-megaphone" onClick={toggleAnnouncement}>
                    <img src="/megaphone.png" alt="megaphone" className="social-icon-megaphone" />
                    {AnnouncementUnreadCount > 0 && (
                      <span className="notification-count">{AnnouncementUnreadCount}</span>
                    )}
                  </i>
                  {isAnnouncementOpen && (
                    <div className="announcement-popup">
                      <button className="close-btn" onClick={() => setIsAnnouncementOpen(false)}>
                        ✖
                      </button>
                      <div className="announcement-text-wrapper">
                        <div className="announcement-icon-wrapper">
                          <img src="/megaphone.png" alt="megaphone" className="announcement-icon" />
                          <div className="waves"></div>
                        </div>
                        {announcements.filter((a) => a.active).length > 0 ? (
                          <ul className="announcement-list">
                            {announcements
                              .filter((a) => a.active)
                              .map((a) => (
                                <li key={a.id} className="announcement-text">
                                  {a.notification}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="no-notifications">No new announcements</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <i className="fas fa-envelope" onClick={toggleMsgDropdown}>
                    {MsgUnreadCount > 0 && <span className="notification-count">{MsgUnreadCount}</span>}
                  </i>
                  {isMsgDropdownOpen && (
                    <div className="notification-dropdown msg-dropdown">
                      {messages.filter((m) => m.active).length > 0 ? (
                        messages
                          .filter((m) => m.active)
                          .map((m) => (
                            <div key={m.id} className="notification-item">
                              <p>{m.notification}</p>
                              <span className="timestamp">{m.formattedTimestamp}</span>
                            </div>
                          ))
                      ) : (
                        <p className="no-notifications">No new messages</p>
                      )}
                    </div>
                  )}

                  {/* Notifications */}
                  <i className="fas fa-bell" onClick={toggleNotificationDropdown}>
                    {NotificationUnreadCount > 0 && (
                      <span className="notification-count">{NotificationUnreadCount}</span>
                    )}
                  </i>
                  {isDropdownOpen && (
                    <div className="notification-dropdown">
                      {notifications.filter((n) => n.active).length > 0 ? (
                        notifications
                          .filter((n) => n.active)
                          .map((n) => (
                            <div key={n.id} className="notification-item read">
                              <p>{n.notification}</p>
                              <span className="timestamp">{n.formattedTimestamp}</span>
                            </div>
                          ))
                      ) : (
                        <p className="no-notifications">No new notifications</p>
                      )}
                    </div>
                  )}

                  {/* Settings */}
                  <i
                    className={`fa-solid fa-user-gear settings-icon ${isSettingsOpen ? "rotate" : ""
                      }`}
                    onClick={toggleSettingsDropdown}
                  ></i>
                  {isSettingsOpen && (
                    <div className="settings-dropdown">
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
      {showNewNotifForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Notification</h2>
            <form onSubmit={handleNewNotifSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={newNotif.body}
                  onChange={(e) => setNewNotif({ ...newNotif, body: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea
                  name="body"
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewNotifForm(false)}>Cancel</button>
                <button type="submit">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <main
        id="renderContainer"
        className={`markets-container ${isCollapsed ? "collapsed-content" : "expanded-content"}`}
      >
        {renderContent()}
      </main>
    </>
  );
};

export default HomePage;  