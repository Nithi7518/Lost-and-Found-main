const Claim = require("../models/Claim");
const VerificationQuestion = require("../models/VerificationQuestion");
const Item = require("../models/Item");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// Get verification questions for an item
exports.getVerificationQuestions = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Get questions without answers
    const verificationData = await VerificationQuestion.findOne({ itemId });
    if (!verificationData) {
      return res.status(404).json({
        success: false,
        message: "No verification questions found for this item",
      });
    }

    // Return questions without answers
    const questionsWithoutAnswers = verificationData.questions.map((q) => ({
      id: q._id,
      question: q.question,
    }));

    res.status(200).json({ success: true, questions: questionsWithoutAnswers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit a claim with responses to verification questions
exports.submitClaim = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { responses } = req.body;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Check if user has already submitted a claim for this item
    const existingClaim = await Claim.findOne({
      itemId,
      claimantId: req.user.id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a claim for this item",
      });
    }

    // Create a new claim
    const newClaim = new Claim({
      itemId,
      claimantId: req.user.id,
      responses,
    });

    await newClaim.save();

    // Notify item owner (this would be implemented with email/notifications)
    const itemOwner = await User.findById(item.user);
    console.log(`Notification would be sent to ${itemOwner.email}`);

    res.status(201).json({
      success: true,
      message:
        "Claim submitted successfully. The item owner will review your answers.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending claims for items I've posted (item owner)
exports.getMyItemClaims = async (req, res) => {
  try {
    // Find items posted by the current user
    const myItems = await Item.find({ user: req.user.id });
    const myItemIds = myItems.map((item) => item._id);

    // Get pending claims for those items
    const pendingClaims = await Claim.find({
      itemId: { $in: myItemIds },
      status: "pending",
    }).populate("claimantId", "name email");

    res.status(200).json({ success: true, claims: pendingClaims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify claim answers (item owner)
exports.verifyClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    }

    // Verify that the current user owns the item
    const item = await Item.findById(claim.itemId);
    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to verify this claim",
      });
    }

    // Update claim status
    claim.status = status;
    await claim.save();

    res.status(200).json({
      success: true,
      message: `Claim ${
        status === "approved" ? "approved" : "rejected"
      } successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check if user has access to view an image
exports.hasImageAccess = async (userId, itemId) => {
  try {
    const item = await Item.findById(itemId);

    // Case 1: User is the item owner
    if (item.user.toString() === userId) {
      return true;
    }

    // Case 2: User has an approved claim
    const approvedClaim = await Claim.findOne({
      itemId,
      claimantId: userId,
      status: "approved",
    });

    return !!approvedClaim;
  } catch (error) {
    console.error(error);
    return false;
  }
};
