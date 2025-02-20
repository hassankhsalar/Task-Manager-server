require('dotenv').config();
const express = require('express');
//const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log("MongoDB Connected"))
// .catch(err => console.error(err));

////////////////////////////


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobtask.cuo7r.mongodb.net/?retryWrites=true&w=majority&appName=jobtask`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const taskCollection = client.db("JobTasks").collection("task");
    const userCollection = client.db("JobTasks").collection("users");
    
    app.get('/task', async(req, res) =>{
        const result = await taskCollection.find().toArray();
        res.send(result);
    })








    /////////////////////////////////////////
    // Send a ping to confirm a successful connection
    await client.db("JobTasks").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



////////////////////////////////////////

app.get('/', (req, res) => {
    res.send("job task API is running...");
});
app.listen(port, () => 
    console.log(`Job running on port ${port}`));
