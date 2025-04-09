require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();

const connectDB = require("./config/db"); // Import the connectDB function

// Connect to MongoDB
connectDB();

// Create private uploads directory if it doesn't exist
const privateUploadsDir = path.join(__dirname, "private/uploads");
if (!fs.existsSync(privateUploadsDir)) {
  fs.mkdirSync(privateUploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const claimRoutes = require("./routes/claims"); // New claims routes

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api", claimRoutes); // Add claim routes under /api

/* // Configure logging to ignore static files
app.use((req, res, next) => {
  const ignoredExtensions = [".css", ".js", ".png", ".jpg", ".ico"];
  const isStaticFile = ignoredExtensions.some((ext) => req.url.endsWith(ext));

  if (!isStaticFile) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
}); */

// Secure image endpoint - only accessible to verified users
app.get("/secure-image/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const token = req.query.token;

    if (!token) {
      return res
        .status(401)
        .sendFile(path.join(__dirname, "public/images/placeholder.jpg"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract itemId from filename (assuming format: "itemId-timestamp.jpg")
    const itemId = filename.split("-")[0];

    // Check if user has access to the image
    const { hasImageAccess } = require("./controllers/claimController");
    const hasAccess = await hasImageAccess(decoded.id, itemId);

    if (hasAccess) {
      return res.sendFile(path.join(__dirname, "private/uploads", filename));
    } else {
      return res
        .status(403)
        .sendFile(path.join(__dirname, "public/images/placeholder.jpg"));
    }
  } catch (error) {
    console.error("Image access error:", error);
    return res
      .status(500)
      .sendFile(path.join(__dirname, "public/images/placeholder.jpg"));
  }
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/home.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
