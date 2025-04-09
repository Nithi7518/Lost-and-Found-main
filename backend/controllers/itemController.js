const Item = require("../models/Item");
const User = require("../models/User");
const Claim = require("../models/Claim");
const VerificationQuestion = require("../models/VerificationQuestion");

// Create a new item (lost or found)
exports.createItem = async (req, res) => {
  try {
    const { name, category, description, date, time, location, type } =
      req.body;

    // Create new item
    const newItem = new Item({
      name,
      category,
      description,
      date: new Date(date),
      time,
      location,
      type,
      user: req.user.id,
      image: req.file ? req.file.filename : "default.jpg",
    });

    const savedItem = await newItem.save();

    // Handle verification questions for found items
    if (type === "found") {
      if (!req.body.questions) {
        return res.status(400).json({
          success: false,
          message: "Verification questions required for found items",
        });
      }

      let questions;
      try {
        questions = JSON.parse(req.body.questions);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid questions format",
        });
      }

      const verificationQuestions = new VerificationQuestion({
        itemId: savedItem._id,
        questions: questions.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
      });

      await verificationQuestions.save();
    }

    // Update user's items
    await User.findByIdAndUpdate(req.user.id, {
      $push: { itemsReported: savedItem._id },
    });

    res.status(201).json({
      success: true,
      item: savedItem,
    });
  } catch (error) {
    console.error("Item creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all items with search and filter
exports.getItems = async (req, res) => {
  try {
    const { search, category, type } = req.query;

    // Build query object
    const query = {};

    // Add type filter (lost or found)
    if (type) {
      query.type = type;
    }

    // Add category filter
    if (category && category !== "All Categories") {
      query.category = category;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query
    const items = await Item.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// In controllers/itemController.js
exports.getUserItems = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { user: req.user.id };

    if (type) {
      query.type = type;
    }

    const items = await Item.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if user owns this item
    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this item",
      });
    }

    await Item.findByIdAndDelete(req.params.itemId);

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getItemResponses = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the item
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if user is the owner of the item
    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view responses for this item",
      });
    }

    // Get responses from the Claim model
    const claims = await Claim.find({ itemId })
      .populate("claimantId", "name email")
      .select("responses status");

    res.status(200).json({
      success: true,
      data: claims,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
