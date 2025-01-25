const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw4nz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db("productHuntDb");
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
            res.send({ token });
          });
      
          const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
              return res.status(401).send({ message: "Unauthorized access" });
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
              if (err) {
                return res.status(401).send({ message: "Unauthorized access" });
              }
              req.decoded = decoded;
              next();
            });
          };
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('hunt started')
})
app.listen(port, () => {
    console.log(`hunt started at port ${port}`);
})