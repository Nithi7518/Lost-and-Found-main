const express = require("express");
const router = express.Router();
const claimController = require("../controllers/claimController");
const { protect } = require("../middleware/auth");

// Get verification questions for an item
router.get(
  "/items/:itemId/questions",
  protect,
  claimController.getVerificationQuestions
);

// Submit a claim with answers
router.post("/items/:itemId/claim", protect, claimController.submitClaim);

// Get pending claims for my items (as item owner)
router.get("/my-items-claims", protect, claimController.getMyItemClaims);

// Verify a claim (approve/reject)
router.put("/claims/:claimId/verify", protect, claimController.verifyClaim);

module.exports = router;
