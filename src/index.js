require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const cors = require("cors");

const app = express();
const PORT = 3000;

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //  minutos
  max: 100, // Máximo solicitudes por IP
  message: "Demasiadas solicitudes desde esta IP. Por favor, inténtelo más tarde.",
});

app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(limiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors()); // Permite solicitudes de cualquier origen.

// Mock database
const users = [{ id: 1, email: "demo@example.com", password: bcrypt.hashSync("Demo@P45ssW0rd123", 10), role: "user" }];

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred", error: err.message });
});

// Signup endpoint
app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    if (users.find((user) => user.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to the "database"
    const user = { id: users.length + 1, email, password: hashedPassword, role };
    users.push(user);

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
app.post("/api/auth/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

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

// Protected route: Get all users
app.get("/api/users/findAll", authenticateJWT, (req, res, next) => {
  try {
    res.json(users.map(({ password, ...user }) => user));
  } catch (error) {
    next(error);
  }
});

// Protected route: Dashboard
app.get("/api/private/dashboard", authenticateJWT, (req, res, next) => {
  try {
    res.json({ message: `Welcome to the dashboard, ${req.user.email}` });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/delete/:id", authenticateJWT, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users.splice(userIndex, 1);
  res.json({ message: "User deleted successfully" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
