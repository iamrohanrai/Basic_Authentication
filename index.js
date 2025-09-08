import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./utils/db.js";

// import all routes
import userRoutes from "./routes/user.routes.js";

dotenv.config(); // if env is in root then its okay to write it like this else mention the path
const app = express();
const port = process.env.PORT ?? 8000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDb();

// user routes
app.use("/api/v1/users/", userRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
