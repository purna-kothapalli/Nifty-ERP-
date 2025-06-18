import './Dashboard.css';
import React, { useEffect, useState } from "react";
import axios from "axios";
import BoxGraph from './BoxGraph';
import Todo from '../Todo/Todo';

// Updated Card component to support three variations:
//   • isUserCard: shows New Users / Total Users
//   • isSpentWinningCard: shows Total Spent (left) and Winning Points (right)
//   • isPayoutCard: shows Payouts data (you can adjust these labels as needed)
const Card = ({
    title,
    color,
    image,
    data,
    growthRate,
    duration,
    isUserCard,
    isPayoutCard,
    isSpentWinningCard,
    isRevenueCard,
    newUsers,
    totalUsers,
    winningPoints
}) => (
    <div className="all-card dashboard-card-container">
        <div className="all-card-content dashboard-content">
            <h2>{title}</h2>
            <div className="all-time-container">
                <div className="all-time-left">
                    {isUserCard ? (
                        <div className="all-time-stats">
                            <div className="user-stats-left">
                                <p className="user-stats-label">New Users</p>
                                <p className="user-stats-value">{newUsers}</p>
                            </div>
                            <div className="vertical-line" />
                            <div className="user-stats-right">
                                <p className="user-stats-label">Total Users</p>
                                <p className="user-stats-value">{totalUsers}</p>
                            </div>
                        </div>
                    ) : isSpentWinningCard ? (
                        <div className="all-time-stats">
                            <div className="user-stats-left">
                                <p className="user-stats-label">Inflow</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> {data}</p>
                            </div>
                            <div className="vertical-line" />
                            <div className="user-stats-right">
                                <p className="user-stats-label">Outflow</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> {winningPoints}</p>
                            </div>
                        </div>
                    ) : isPayoutCard ? (
                        <div className="all-time-stats">
                            <div className="user-stats-left">
                                <p className="user-stats-label">Total</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> {data}</p>
                            </div>
                            <div className="vertical-line" />
                            <div className="user-stats-right">
                                <p className="user-stats-label">24 hours</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> 0</p>
                            </div>
                        </div>
                    ) : isRevenueCard ? (
                        <div className="all-time-stats">
                            <div className="user-stats-left">
                                <p className="user-stats-label">Total</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> {data}</p>
                            </div>
                            <div className="vertical-line" />
                            <div className="user-stats-right">
                                <p className="user-stats-label">24 hours</p>
                                <p className="user-stats-value"><span className="bid-amount dashboard-amount">₹</span> 0</p> {/* You can replace this with actual 24hr revenue if available */}
                            </div>
                        </div>
                    ) : (
                        <p className="all-time">{data}</p>
                    )}
                </div>
            </div>
        </div>
        <div className={`all-card-icon ${color}`}>
            <img src={image} alt={title} className="all-icon" />
        </div>
        {growthRate !== undefined && (
            <div className="order-footer">
                <div className="stats-background">
                    <span className={`growth-rate ${growthRate > 0 ? "increase" : "decrease"}`}>
                        {growthRate > 0 ? "▲" : "▼"} {Math.abs(growthRate)}%
                    </span>
                    <span>{duration}</span>
                    <a href="#markets">View More</a>
                </div>
            </div>
        )}
    </div>
);

const Dashboard = () => {
    const [totalUsers, setTotalUsers] = useState(0);
    const [last24HoursUsers, setLast24HoursUsers] = useState(0);
    const [last24HoursGrowth, setLast24HoursGrowth] = useState(0);
    const [lastWeekGrowth, setLastWeekGrowth] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [lastWeekRevenueGrowth, setLastWeekRevenueGrowth] = useState(0);
    const [lastWeekSpentGrowth, setLastWeekSpentGrowth] = useState(0);
    const [userPoints, setUserPoints] = useState(0);
    const [totalWinningPoints, setTotalWinningPoints] = useState(0);
    const today = new Date();
    const bidStatsDateStr = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short"
    });
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // --- USER STATS & REVENUE/SPENT CALCULATIONS ---
                const userRes = await axios.get("https://prod-erp.nifty10.in/get/activeUser");
                const users = userRes.data.data || [];
                const customers = users.filter(u => u.userType === "CUSTOMER");
                setTotalUsers(customers.length);

                // Total user points
                const totalUserPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
                setUserPoints(Math.round(totalUserPoints).toLocaleString("en-IN"));

                // Date ranges for growth
                const now = new Date();
                const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const prevWeekStart = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

                const newUsers24h = customers.filter(u => new Date(u.createdDate) >= last24h).length;
                const newUsersWeek = customers.filter(u => new Date(u.createdDate) >= lastWeek).length;

                const prev24hCount = users.filter(u =>
                    new Date(u.createdDate) >= new Date(last24h.getTime() - 24 * 60 * 60 * 1000) &&
                    new Date(u.createdDate) < last24h
                ).length;
                const prevWeekCount = users.filter(u =>
                    new Date(u.createdDate) >= prevWeekStart &&
                    new Date(u.createdDate) < lastWeek
                ).length;

                const calcGrowth = (newC, prevC) =>
                    prevC === 0 ? (newC > 0 ? 100 : 0) : Math.min(((newC - prevC) / prevC) * 100, 100);
                setLast24HoursUsers(newUsers24h);
                setLast24HoursGrowth(calcGrowth(newUsers24h, prev24hCount).toFixed(2));
                setLastWeekGrowth(calcGrowth(newUsersWeek, prevWeekCount).toFixed(2));

                // Revenue
                const totalRev = users.reduce((sum, u) => sum + (u.investedMoney || 0), 0);
                setTotalRevenue(totalRev);
                const revLastWeek = users.filter(u => new Date(u.createdDate) >= lastWeek)
                    .reduce((sum, u) => sum + (u.investedMoney || 0), 0);
                const revPrevWeek = users.filter(u =>
                    new Date(u.createdDate) >= prevWeekStart &&
                    new Date(u.createdDate) < lastWeek
                ).reduce((sum, u) => sum + (u.investedMoney || 0), 0);
                setLastWeekRevenueGrowth(calcGrowth(revLastWeek, revPrevWeek).toFixed(2));

                // --- BIDS & SPENT & WINNERS for today ---
                try {
                    const response = await axios.get("https://prod-erp.nifty10.in/user/metrics");
                    const { totalSpent, spentGrowth, totalWinningPoints } = response.data;
              
                    setTotalSpent(totalSpent || 0);
                    setLastWeekSpentGrowth(spentGrowth || "0.00");
                    setTotalWinningPoints(totalWinningPoints || 0);
                    
                  } catch (error) {
                    console.error("Failed to fetch user metrics:", error.message);
                  }

            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="all-markets-bg-container dashboard-container">
            <div className="all-cards-container dashboard-cards-container">
                <Card
                    key="userStats"
                    title="USER STATS"
                    image="./total-users.png"
                    color="Bullish"
                    newUsers={last24HoursUsers}
                    totalUsers={totalUsers}
                    growthRate={lastWeekGrowth}
                    duration="Last Week"
                    isUserCard
                />

                {/*
         * Card for Total Spent and Winning Points in one:
         * Uses the new flag isSpentWinningCard.
         */}
                <Card
                    key="spentAndWinning"
                    title={`BIDS STATS (${bidStatsDateStr})`}
                    color="Bank"
                    image="./total-spent.png"
                    data={totalSpent.toLocaleString()}
                    winningPoints={totalWinningPoints.toLocaleString()}
                    growthRate={lastWeekSpentGrowth}
                    duration="Last week"
                    isSpentWinningCard
                />


                {/*
         * Separate Card for Payouts.
         * In this example, we display Payouts (userPoints) as single data.
         * (Adjust labels inside Card component if needed.)
         */}
                <Card
                    key="Payouts"
                    title="PAYOUT STATS"
                    color="Bearish"
                    image="./payouts.png"
                    data={userPoints}
                    growthRate={last24HoursGrowth}
                    duration="Last 24hrs"
                    isPayoutCard
                />

                <Card
                    key="totalRevenue"
                    title="REVENUE STATS"
                    color="Nifty"
                    image="./total-revenue.png"
                    data={totalRevenue.toLocaleString()}
                    growthRate={lastWeekRevenueGrowth}
                    duration="Last week"
                    isRevenueCard
                />

            </div>
            <div className="dashboard-graph-todo">
                <BoxGraph />
                <Todo />
            </div>
        </div>
    );
};

export default Dashboard;