require("dotenv").config();  
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_BASE_URL =
  NODE_ENV === "production"
    ? process.env.PROD_API_BASE_URL
    : process.env.DEV_API_BASE_URL;
const adminUserId = "556c3d52-e18d-11ef-9b7f-02fd6cfaf985";
app.use(express.json());
// Enable CORS with explicit settings
app.use(
    cors({
      origin: "*", // Allow requests from frontend
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: "Content-Type,Authorization",
      credentials: true, // Allow cookies if needed
    })
  );

  app.get("/", (req, res) => {
    return res.status(200).json({message: "Successfully Connected Backend..!", body: "Dev Is Live now..!"})
  })

  app.put("/user/send-otp", async (req, res) => {
  const { mobileNo } = req.body;
  
    if (!mobileNo) {
      return res.status(400).json({ error: "Mobile number is required" });
    }
  
    try {
      const response = await axios.put(
        `${API_BASE_URL}/nif/user/sendOtp`,
        {},
        {
          params: { mobileNo },
        }
      );
  
      res.status(200).json({ otp: response.data.data?.otp });
    } catch (error) {
      console.error("Send OTP Error:", error.message);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

// Verify OTP (accept Otp in body)
app.put("/user/verify-otp", async (req, res) => {
  let { Otp } = req.body;

  if (!Otp) {
    return res.status(400).json({ error: "Otp is required" });
  }

  // Convert OTP to a number
  Otp = Number(Otp);

  if (isNaN(Otp)) {
    return res.status(400).json({ error: "Otp must be a valid number" });
  }

  try {
    console.log("Verifying OTP with payload:", {
      Otp,
      userId: adminUserId,
    });

    await axios.put(
      `${API_BASE_URL}/nif/user/verifyOtp`,
      {},
      {
        params: {
          Otp,
          userId: adminUserId,
        },
      }
    );

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log("adminUserId:", adminUserId);
    console.error("OTP Verification Error:", error.message);
    res.status(500).json({ error: "OTP verification failed" });
  }
});


app.get("/get/company", async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/company`);

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching Prod data:", error.message);
        res.status(500).json({ error: "Failed to fetch data from Prod" });
    }
});

app.post("/company/update", async (req, res) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/company/update/company?userId=${adminUserId}`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error updating company:", error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || "Something went wrong";
    res.status(status).json({ error: message });
  }
});

app.post("/company/create", async (req, res) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/company/create?userId=${adminUserId}`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error creating company:", error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || "Something went wrong";
    res.status(status).json({ error: message });
  }
});


app.get("/get/market", async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/market`, { timeout: 5000 });
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            // Server responded with a status code other than 2xx
            res.status(error.response.status).json({ error: error.response.data });
        } else if (error.request) {
            // Request was made but no response received
            res.status(502).json({ error: "No response from market API" });
        } else {
            // Something else went wrong
            res.status(500).json({ error: "Internal Server Error" });
        }
        console.error("Error fetching market data:", error.message);
    }
});

app.get("/users/list", async (req, res) => {

  const defaultUsersSize = 1000;
  try {
    const response = await axios.get(
      `${API_BASE_URL}/nif/user/list/user?size=${defaultUsersSize}`
    );
    
    if (response.data?.data?.content) {
      return res.status(200).json(response.data.data);
    } else {
      return res.status(404).json({ error: "No user data found" });
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Fetch transactions history from the external API
app.post("/user/wallet-history", async (req, res) => {
  const { startDate, endDate, userId } = req.body;
  

  // Validate the request body
  if (!startDate || !endDate || !userId) {
    return res.status(400).json({ error: "Start date, end date, and user ID are required." });
  }

  try {
    // Call the external API
    const response = await axios.get(
      `${API_BASE_URL}/nif/user/wallet/historyhistory?startDate=${startDate}&endDate=${endDate}&userId=${userId}`
    );

    // Check if the response contains data
    if (response.data?.data) {
      return res.status(200).json(response.data.data); // Send data to frontend
    } else {
      return res.status(404).json({ error: "No transaction data found" });
    }
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Update user active status
app.post("/user/updateUser", async (req, res) => {
  const { userId, name, isActive } = req.body;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/nif/user/user/updateUser`,
      { userId, name, isActive },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ error: "Failed to update user status" });
  }
});


app.post("/post/notification", async (req, res) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/notifications/dashboard/create`,
            req.body,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error posting notification:", error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data || "Something went wrong";
        res.status(status).json({ error: message });
    }
});
app.post("/bids/update", async (req, res) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/bid/configuration/update?userId=${adminUserId}`,
        req.body,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error updating bid:", error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data || "Something went wrong";
      res.status(status).json({ error: message });
    }
  });

  app.post("/bids/create", async (req, res) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/bid/configuration/create?userId=${adminUserId}`,
        req.body,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error Creating bid:", error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data || "Something went wrong";
      res.status(status).json({ error: message });
    }
  });

app.get("/user/metrics", async (req, res) => {
  try {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB").split("/").join("-");
    const marketIds = [
      "6187ba91-e190-11ef-9b7f-02fd6cfaf985",
      "877c5f82-e190-11ef-9b7f-02fd6cfaf985",
      "97f37603-e190-11ef-9b7f-02fd6cfaf985",
      "9f0c2c24-e190-11ef-9b7f-02fd6cfaf985",
    ];

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const weekAgo = now.getTime() - 7 * msPerDay;
    const twoWeeksAgo = weekAgo - 7 * msPerDay;

    const marketData = await Promise.all(
      marketIds.map(async (id) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/bid/market?Date=${formattedDate}&marketId=${id}&userId=${adminUserId}`
          );
          const json = await response.json();
          return json.data || [];
        } catch (err) {
          console.error(`Market ${id} fetch failed:`, err);
          return [];
        }
      })
    );

    const allBids = marketData.flat();
    const paidBids = allBids.filter(b => b.active && !b.freeBid);

    const totalSpent = paidBids.reduce(
      (sum, b) => sum + b.entryFee * (b.bidSlots - b.totalAvailableCount),
      0
    );

    const spentLastWeek = allBids
      .filter(b => {
        const t = new Date(b.createdDate).getTime();
        return t >= weekAgo && t < now.getTime() && b.active && !b.freeBid;
      })
      .reduce((sum, b) => sum + b.entryFee * (b.bidSlots - b.totalAvailableCount), 0);

    const spentPrevWeek = allBids
      .filter(b => {
        const t = new Date(b.createdDate).getTime();
        return t >= twoWeeksAgo && t < weekAgo && b.active && !b.freeBid;
      })
      .reduce((sum, b) => sum + b.entryFee * (b.bidSlots - b.totalAvailableCount), 0);

    const calcGrowth = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    const spentGrowth = calcGrowth(spentLastWeek, spentPrevWeek);

    const winnerLists = await Promise.all(
      paidBids.map(bid =>
        axios
          .post(`${API_BASE_URL}/bid/get/winnerList?dayWiseBidId=${bid.dayWiseBidId}`)
          .then(res => res.data.data || [])
          .catch(err => {
            console.error(`Error fetching winners for ${bid.dayWiseBidId}:`, err);
            return [];
          })
      )
    );

    const allWinners = winnerLists.flat();
    const totalWinningPoints = Math.round(
      allWinners.reduce((sum, w) => sum + (w.winningPoint || 0), 0)
    );

    res.json({
      totalSpent,
      spentGrowth: spentGrowth.toFixed(2),
      totalWinningPoints,
    });
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    res.status(500).json({ error: "Failed to fetch user metrics" });
  }
});

app.post("/bids/submit-market-result", async (req, res) => {
  try {
    const { stocks, trend, effectiveMarketId, performanceData } = req.body;

    if (!effectiveMarketId || !stocks || !performanceData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const todayDate = new Date().toLocaleDateString("en-GB").split("/").join("-");

    const formattedData = stocks.map((stock) => ({
      companyId: stock.companyId,
      companyName: stock.companyName,
      companyStatus: trend,
      rank: 0,
      point: 0,
      currentPoint: 0,
      dayPerformance: parseFloat(performanceData[stock.companyId]) || 0,
      specialCompany: false,
      liveBB: true,
    }));

    const url = `${API_BASE_URL}/bid/market/result?date=${todayDate}&marketId=${effectiveMarketId}&userId=${adminUserId}`;

    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedData),
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error("Remote API Error:", errorText);
      return res.status(500).json({ error: "Failed to submit data to remote API" });
    }

    res.json({ message: "Result submitted successfully!" });
  } catch (error) {
    console.error("Error in backend submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get/notifications", async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/notifications/dashboard`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

app.get("/get/bidMarket", async (req, res) => {
    const { Date, marketId } = req.query;

    if (!Date || !marketId) {
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    const apiUrl = `${API_BASE_URL}/bid/market?Date=${Date}&marketId=${marketId}&userId=${adminUserId}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching bid market data:", error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data || "Something went wrong";
        res.status(status).json({ error: message });
    }
});

app.get("/change/status", async (req, res) => {
    const { dayWiseBidId, status } = req.query;
  
    try {
      const response = await axios.get(
        `${API_BASE_URL}/bid/change/daily/bid/status`,
        {
          params: {
            dayWiseBidId,
            status,
          },
        }
      );
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error updating bid status:", error.message);
      const statusCode = error.response?.status || 500;
      const message = error.response?.data || "Failed to change bid status";
      res.status(statusCode).json({ error: message });
    }
  });
  
  app.get("/bids/config", async (req, res) => {
    try {
      // Make a request to the external API
      const response = await axios.get(
        `${API_BASE_URL}/bid/configuration/all`
      );
  
      // Send the response data back to the frontend
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error fetching bids:", error.message);
      const statusCode = error.response?.status || 500;
      const message = error.response?.data || "Failed to fetch bids";
      res.status(statusCode).json({ error: message });
    }
  });
  
  app.get("/get/activeUser", async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/nif/user/list/activeUser`, { timeout: 5000 });
        res.json(response.data);  // Send the fetched data as JSON response
    } catch (error) {
        if (error.response) {
            // Server responded with a status code other than 2xx
            res.status(error.response.status).json({ error: error.response.data });
        } else if (error.request) {
            // Request was made but no response received
            res.status(502).json({ error: "No response from active user API" });
        } else {
            // Something else went wrong
            res.status(500).json({ error: "Internal Server Error" });
        }
        console.error("Error fetching active user data:", error.message);
    }
});

app.get("/bids/holidays", async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bid/holiday/configuration`);
    res.json({ data: response.data.data || [] });
  } catch (error) {
    console.error("Error fetching holidays:", error.message);
    res.status(500).json({ error: "Failed to fetch holidays from external API" });
  }
});

app.post("/bids/holiday/configuration", async (req, res) => {
  const { date, name } = req.body;

  if (!date || !name) {
    return res.status(400).json({ error: "Missing date or holiday name" });
  }

  const url = `${API_BASE_URL}/bid/holiday/configuration?date=${date}&name=${name}`;

  try {
    const response = await axios.post(url);
    res.status(200).json({ message: "Holiday submitted successfully", data: response.data });
  } catch (error) {
    console.error("Error submitting holiday:", error.message);
    res.status(500).json({ error: "Failed to submit holiday" });
  }
});
  

app.post("/user/transactions", async (req, res) => {
  const { startDate, endDate, userId } = req.body;

  if (!startDate || !endDate || !userId) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const url = `${API_BASE_URL}/nif/user/wallet/historyhistory?endDate=${endDate}&startDate=${startDate}&userId=${userId}`;
    
    const response = await axios.post(url, null, {
      headers: { accept: "application/json" },
    });

    res.json({ data: response.data.data || [] });
  } catch (error) {
    console.error("Transaction fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch transaction history." });
  }
});
app.put("/company/bulk/update/company", async (req, res) => {
  const companyUpdates = req.body;

  try {
    const apiResponse = await axios.put(
      `${API_BASE_URL}/company/bulk/update/company?userId=${adminUserId}`,
      companyUpdates,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    res.status(200).json({ message: "Update successful", data: apiResponse.data });
  } catch (error) {
    console.error("Error in Live BB update:", error.message);
    res.status(500).json({ error: "Failed to update company data" });
  }
});
app.post("/api/notifications/new", async (req, res) => {
  try {
    const { body, title } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body are required" });
    }

    const apiURL = `${API_BASE_URL}/api/notifications/custom?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    const apiResponse = await axios.post(apiURL);

    res.status(200).json({ success: true, data: apiResponse.data });
  } catch (error) {
    console.error("Error posting to external notification API:", error.message);

    if (error.response) {
      console.error("Response data:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data,
      });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await fetch(`${API_BASE_URL}/nif/user/getUserById?userId=${userId}`);
    const data = await response.json();

    if (data.data) {
      res.status(200).json({ success: true, user: data.data });
    } else {
      res.status(404).json({ success: false, message: "User info not found." });
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ success: false, message: "Error fetching user info." });
  }
});
app.post("/company/update/all", async (req, res) => {
  const updatedStocks = req.body;

  try {
    await Promise.all(
      updatedStocks.map((stock) =>
        axios.post(
          `${API_BASE_URL}/company/update/company?userId=${adminUserId}`,
          {
            companyId: stock.companyId,
            companyName: stock.companyName,
            companyCode: stock.companyCode,
            companyPoint: stock.companyPoint || 0,
            companyStatus: stock.companyStatus,
            liveBB: false,
            active: true,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    res.status(200).json({ message: "Market status updated successfully" });
  } catch (error) {
    console.error("Backend API Error:", error.message);
    res.status(500).json({ error: "Failed to update market status" });
  }
});
app.get('/user/bids', async (req, res) => {
  const { userId } = req.query;  // Extract userId from query parameters

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    // Fetch data from the external API using userId
    const response = await fetch(
      `${API_BASE_URL}/user/bid/getPlaceBid?userId=${userId}`
    );
    const result = await response.json();

    // Return the result as a response to the frontend
    if (result?.data && Array.isArray(result.data)) {
      res.json({ bids: result.data });
    } else {
      res.json({ bids: [] });
    }
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

app.get("/user/getUserById", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/nif/user/getUserById?userId=${userId}`
    );
    const data = response.data;
    res.json(data); // Send the user info data back to the frontend
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});
// Install first: npm install express axios cors

app.post('/send-sms', async (req, res) => {
  const { numbers, message } = req.body;

  const formattedNumbers = numbers.join(',');

  const data = new URLSearchParams({
    apikey: 'Nzc3OTZmNjU2YTUyNDY3YTM0Mzg3NjQ0NmM0ZjQ5NGY=',
    numbers: formattedNumbers,
    sender: 'FINPGS', // or your registered DLT-approved sender
    message,
  });

  try {
    const response = await axios.post('https://api.textlocal.in/send/', data);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send SMS', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Using API base: ${API_BASE_URL}`);
});