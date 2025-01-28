const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw4nz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //await client.connect();
    //console.log("Connected to MongoDB!");

    const db = client.db("productHuntDb");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const reviewsCollection = db.collection("reviews");
    const couponsCollection = db.collection("coupons");
    const paymentCollection = db.collection("payments");

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
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    const verifyModerator = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role !== "moderator") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    const validateObjectId = (req, res, next) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID" });
      }
      next();
    };

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/profile", verifyToken, async (req, res) => {
      const email = req.decoded.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });
    app.get("/users/moderator/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.send({ moderator: user.role === "moderator" });
    });

    app.get("/moderator-only", verifyToken, verifyModerator, (req, res) => {
      res.send({ message: "This is a moderator-only route!" });
    });
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.send({ admin: user.role === "admin" });
    });

    app.get("/admin-only", verifyToken, verifyAdmin, (req, res) => {
      res.send({ message: "This is a admin-only route!" });
    });
    app.patch("/users/make-moderator/:id", verifyToken, verifyAdmin, validateObjectId, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "moderator" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/make-admin/:id", verifyToken, verifyAdmin, validateObjectId, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/products/featured", async (req, res) => {
      const result = await productsCollection
        .find({ isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .toArray();
      res.send(result);
    });

    app.patch("/products/featured/:id", verifyToken, verifyModerator, validateObjectId, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { isFeatured: true } };
      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/products/trending", async (req, res) => {
      const result = await productsCollection
        .find()
        .sort({ upvotes: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/products/reported", verifyToken, verifyModerator, async (req, res) => {
      const result = await productsCollection.find({ reportedBy: { $exists: true, $ne: [] } }).toArray();
      res.send(result);
    });

    app.get("/products/:id", validateObjectId, async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.findOne({ _id: new ObjectId(id) });
      if (!result) {
        return res.status(404).send({ message: "Product not found" });
      }
      res.send(result);
    });

    app.post("/products", verifyToken, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.get("/products/my-products", verifyToken, async (req, res) => {
      const email = req.decoded.email;
      try {
        const result = await productsCollection.find({ owner: email }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch products", error });
      }
    });


    app.patch("/products/upvote/:id", verifyToken, validateObjectId, async (req, res) => {
      const productId = req.params.id;
      const userId = req.decoded.email;
    
      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
    
      if (product.voters?.includes(userId)) {
        return res.status(400).send({ message: "Already voted" });
      }
    
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $inc: { upvote: 1 }, $push: { voters: userId } }
      );
      res.send(result);
    });

    app.post("/products/report/:id", verifyToken, validateObjectId, async (req, res) => {
      const productId = req.params.id;
      const userId = req.decoded.email;

      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (product.reportedBy.includes(userId)) {
        return res.status(400).send({ message: "Already reported" });
      }

      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $push: { reportedBy: userId } }
      );
      res.send(result);
    });

    app.get("/products/review-queue", verifyToken, verifyModerator, async (req, res) => {
      const result = await productsCollection.find({ status: "pending" }).toArray();
      res.send(result);
    });

    app.patch("/products/status/:id", verifyToken, verifyModerator, validateObjectId, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status } };
      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/products/search", async (req, res) => {
      const searchTerm = req.query.term;
      const page = parseInt(req.query.page) || 1;
      if (isNaN(page) || page < 1) {
        return res.status(400).send({ message: "Invalid page number" });
      }
    
      const limit = 6;
      const skip = (page - 1) * limit;
    
      const query = searchTerm ? { tags: { $regex: searchTerm, $options: "i" } } : {};
    
      const products = await productsCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
    
      const totalProducts = await productsCollection.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);
    
      res.send({ products, totalPages, currentPage: page });
    });

    app.get("/reviews/:productId", async (req, res) => {
      const productId = req.params.productId;
      const result = await reviewsCollection.find({ productId }).toArray();
      res.send(result);
    });

    app.post("/reviews", verifyToken, async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get("/statistics", verifyToken, verifyAdmin, async (req, res) => {
      const totalProducts = await productsCollection.countDocuments();
      const totalUsers = await usersCollection.countDocuments();
      const totalReviews = await reviewsCollection.countDocuments();
      res.send({ totalProducts, totalUsers, totalReviews });
    });

    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    app.post('/payments', verifyToken, async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send({ paymentResult: result });
    });
    app.patch('/users/update-subscription/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const updateDoc = { $set: { isSubscribed: true } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/coupons", verifyToken, verifyAdmin, async (req, res) => {
      const coupon = req.body;
      const result = await couponsCollection.insertOne(coupon);
      res.send(result);
    });

    app.get("/coupons", verifyToken, verifyAdmin, async (req, res) => {
      const result = await couponsCollection.find().toArray();
      res.send(result);
    });

    app.delete("/coupons/:id", verifyToken, verifyAdmin, validateObjectId, async (req, res) => {
      const id = req.params.id;
      const result = await couponsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("ProductHunt server is running");
    });

    app.listen(port, () => {
      console.log(`ProductHunt server is running on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);