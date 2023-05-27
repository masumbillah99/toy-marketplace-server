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
const client = new MongoClient(
  uri,
  { useUnifiedTopology: true },
  { useNewUrlParser: true },
  { connectTimeoutMS: 30000 },
  { keepAlive: 1 }
);

// verify jwt token
const verifyJWT = async (req, res, next) => {
  console.log("hitting verify jwt");
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const categoryCollection = client.db("carToysDB").collection("categories");
    const toyCollection = client.db("carToysDB").collection("carToys");
    const postCollection = client.db("carToysDB").collection("postToys");

    // JWT (json-web-tokens)
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);
      res.send({ token });
    });

    app.get("/toySearchByName/:text", async (req, res) => {
      // searching functionality
      // creating index on two fields
      // const indexKeys = { toy_name: 1, sub_category: 1 }; // replace field1 and field2 with your actual field names
      // const indexOptions = { name: "nameCategory" }; // replace index name with the desired index name
      // const result2 = await postCollection.createIndex(indexKeys, indexOptions);

      const searchText = req.params.text;
      const result = await postCollection
        .find({
          $or: [
            { toy_name: { $regex: searchText, $options: "i" } },
            { sub_category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

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
      res.send(result);
    });

    // get post all toys from database
    app.get("/allPostToys", verifyJWT, async (req, res) => {
      // console.log(req.headers.authorization);

      let query = {};
      if (req.query?.email) {
        query = { seller_email: req.query.email };
      }
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/allPostToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    // get specified data
    // app.get("/allPostToys", async (req, res) => {
    //   console.log(req.query);
    // });

    // get your add toys by email
    app.get("/myToys/:email", async (req, res) => {
      // console.log(req.params.email);3
      const result = await postCollection
        .find({ seller_email: req.params.email })
        .toArray();
      res.send(result);
    });

    // app.get("/myToys", async (req, res) => {
    //   console.log(req.query.seller_email);
    //   // console.log(req.headers.authorization);
    //   let query = {};
    //   if (req.query?.seller_email) {
    //     query = { email: req.query.seller_email };
    //   }
    //   const result = await postCollection.find(query).toArray();
    //   // res.send(result);
    // });

    // update toy information
    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description,
        },
      };
      const result = await postCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // app.get("/update/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await toyCollection.findOne(query);
    //   res.send(result);
    // });

    // load categories data
    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    // load data by category
    app.get("/categories/:id", async (req, res) => {
      const toys = await toyCollection.find().toArray();
      const id = parseInt(req.params.id);
      console.log(id);
      if (id === 0) {
        res.send(toys);
      } else {
        const categoryToys = toys.filter(
          (sub) => parseInt(sub.category_id) === id
        );
        res.send(categoryToys);
      }
    });

    // delete toy
    app.delete("/postToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
