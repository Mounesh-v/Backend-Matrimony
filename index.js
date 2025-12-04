import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectDb from "./config/db.js";
import router from "./routes/UserRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import path from "node:path";
import groomRoutes from "./routes/groomRoutes.js";
import brideRoutes from "./routes/brideRoutes.js";
import Router from "./routes/otpRoute.js";

const app = express();
dotenv.config();
ConnectDb();
app.use(cors(
  {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// routes
app.use("/api/grooms", groomRoutes);
app.use("/api/brides", brideRoutes);
app.use("/api/user", router);
app.use("/api/admin", adminRoutes);
app.use("/api/otp", Router)

const port = 5000;

app.listen(port, (req, res) => {
  console.log(`Server is running on http://localhost:${port}`);
});
