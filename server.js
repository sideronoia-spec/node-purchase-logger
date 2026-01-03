import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 🔥 MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log("MongoDB Connected");
  app.listen(PORT, () =>
    console.log("Server running on port", PORT)
  );
})
.catch(err => {
  console.error("MongoDB Connection Failed:", err);
});

// 🔥 Schema
const expenseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Expense = mongoose.model("Expense", expenseSchema);

// ➕ Add expense (multiple entries per day)
app.post("/add", async (req, res) => {
  try {
    const { date, amount } = req.body;
    await Expense.create({ date, amount });
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Failed to add expense");
  }
});

// 📄 Get all expenses
app.get("/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// ❌ Delete expense
app.get("/delete/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Delete failed");
  }
});
