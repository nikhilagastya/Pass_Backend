"use strict";

require("dotenv").load();
const express = require("express");
const path = require("path");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const User = require("./model");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "views")));
const mongoose = require("mongoose");
app.use(cors());
const Razorpay = require("razorpay");
const Port = process.env.PORT || 3000;
const instance = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

async function run() {
  try {
    await mongoose.connect(
      "mongodb+srv://student:qwerty123@cluster0.801etc0.mongodb.net/?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to DB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run();

app.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

app.get("/api/v1/rzp_capture/:payment_id/:amount", (req, res) => {
  const { payment_id } = req.params;
  const amount = Number(req.params.amount * 100);
  instance.payments
    .capture(payment_id, amount)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.json(error);
    });
});

app.get("/api/v1/rzp_refunds/:payment_id", (req, res) => {
  const { payment_id } = req.params;
  instance.payments
    .refund(payment_id)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.json(error);
    });
});

app.post("/send_details", async (req, res) => {
  try {
    await User.create({
      name: req.body.name,
      rno: req.body.rno,
      phno: req.body.phno,
      id: req.body.id,
      uniqkey: req.body.uniqKey,
      entry: req.body.entry,
    });
    res.json({ Success: true });
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.post("/verify", async (req, res) => {
  try {
    let uid = req.body.uniqkey;
    console.log(uid);
    let data = await User.find({ uniqkey: uid });
    console.log(data);
    if (data.length === 0) {
      return res.json({
        Success: false,
        errors: "Given Student didn't register",
      });
    }

    if (data[0].entry === true) {
      return res.json({ Success: false, errors: "QR already scanned" });
    } else {
      await User.updateOne(
        { uniqkey: uid },
        {
          $set: {
            name: data[0].name,
            rno: data[0].rno,
            phno: data[0].phno,
            id: data[0].id,
            uniqkey: data[0].uniqkey,
            entry: true,
          },
        }
      );
      res.json({ Success: true });
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.listen(Port, () => console.log("Listening on port 3000"));
