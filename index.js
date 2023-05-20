const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const categories = require("./data/categories.json");
const allCarToys = require("./data/single_toy.json");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.og57wk2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toyCollection = client.db("carToysDB").collection("carToys");
    const postCollection = client.db("carToysDB").collection("postToys");

    app.get("/carToys", async (req, res) => {
      const result = await toyCollection.find().toArray();
      res.send(result);
    });

    app.get("/carToys/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    // post new toys in database
    app.post("/postToys", async (req, res) => {
      const postBody = req.body;
      const result = await postCollection.insertOne(postBody);
      // console.log(result);
      res.send(result);
    });

    // get post all toys from database
    app.get("/allPostToys", async (req, res) => {
      const result = await postCollection.find({}).toArray();
      res.send(result);
    });

    // get your add toys by email
    app.get("/myToys/:email", async (req, res) => {
      // console.log(req.params.email);3
      const result = await postCollection
        .find({ seller_email: req.params.email })
        .toArray();
      res.send(result);
    });

    // load categories data
    app.get("/categories", (req, res) => {
      res.send(categories);
    });

    // load data by category
    app.get("/categories/:id", (req, res) => {
      const id = parseInt(req.params.id);
      // console.log(id);
      if (id === 0) {
        res.send(allCarToys);
      } else {
        const categoryToys = allCarToys.filter(
          (sub) => parseInt(sub.category_id) === id
        );
        res.send(categoryToys);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// check server is running
app.get("/", (req, res) => {
  res.send("e-car toys server is running");
});

app.listen(port, () => {
  console.log(`e-car toys is running on port: ${port}`);
});
