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

const apiRouter = express.Router();

apiRouter.use("/auth", require("./modules/auth/auth.module.js"));
apiRouter.use("/user", require("./modules/user/user.module.js"));
app.use("/api", apiRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
