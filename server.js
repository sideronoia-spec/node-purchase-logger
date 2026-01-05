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
  console.log("MongoDB Connected:", mongoose.connection.name);
  app.listen(PORT, () =>
    console.log("Server running on port", PORT)
  );
})
.catch(err => {
  console.error("MongoDB Connection Failed:", err);
});

// 🔥 Schema
const expenseSchema = new mongoose.Schema({
  date: { type: String, required: true },        // 2026-01-05
  month: { type: Number, required: true },       // 1 = Jan
  year: { type: Number, required: true },        // 2026
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Expense = mongoose.model("Expense", expenseSchema);

// ➕ Add expense (multiple entries per day)
app.post("/add", async (req, res) => {
  try {
    const { date, amount } = req.body;

    const d = new Date(date);

    await Expense.create({
      date,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      amount
    });

    res.redirect("/");
  } catch (err) {
    res.status(500).send("Failed to add expense");
  }
});
app.get("/monthly-summary/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;

    const summary = await Expense.aggregate([
      {
        $match: {
          month: Number(month),
          year: Number(year)
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(summary[0] || { totalAmount: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate monthly total" });
  }
});
app.get("/monthly-report", async (req, res) => {
  const report = await Expense.aggregate([
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  res.json(report);
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

app.get("/daily-report/:year/:month", async (req, res) => {
  const { year, month } = req.params;

  const data = await Expense.aggregate([
    {
      $match: {
        year: Number(year),
        month: Number(month)
      }
    },
    {
      $group: {
        _id: "$date",
        total: { $sum: "$amount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(data);
});
