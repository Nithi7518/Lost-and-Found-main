const express = require("express");
const router = express.Router();
const {
  register,
  login,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth"); // Add auth middleware

// Existing routes
router.post("/register", register);
router.post("/login", login);

// Add password change route with auth middleware
router.post("/change-password", protect, changePassword);

module.exports = router;
