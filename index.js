require('dotenv').config()
const PORT = process.env.PORT || 3000;

const express = require("express");
const request = require("request");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/proxy", (req, res) => {
    const symbol = req.query.symbol || "BANKNIFTY";
    const nsit = req.query.nsit || process.env.NSIT;
    const nseappid = req.query.nseappid || process.env.NSEAPPID;

    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;

    request.get(
        {
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Referer": "https://www.nseindia.com/",
                "Cookie": `nsit=${nsit}; nseappid=${nseappid}`
            }
        },
        (error, response, body) => {
            if (error) return res.status(500).send("Proxy Error");
            res.send(body);
        }
    );
});
app.get("/", (req, res) => {
    res.send("Hello World");
})
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;