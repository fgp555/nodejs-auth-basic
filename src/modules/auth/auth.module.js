require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersMock = require("../../data/usersMock.js");

const app = express.Router();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred", error: err.message });
});

// Signup endpoint
app.post("/signup", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    if (usersMock.find((user) => user.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to the "database"
    const user = { id: usersMock.length + 1, email, password: hashedPassword, role };
    usersMock.push(user);

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Signin endpoint
app.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = usersMock.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "10y" });

    // Send the token and user info in the response
    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = app;
