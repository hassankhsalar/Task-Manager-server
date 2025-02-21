require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { ObjectId } = require('mongodb');
const app = express();
app.use(express.json());
app.use(cors());


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
    


    app.post('/users', async(req, res)=>{
      const user = req.body;
      //insert if user new
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({ message: 'user exists', insertedId: null })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);


    })

    //////////////////////////////

    // Get Tasks by User
    app.get('/tasks', async (req, res) => {
      const email = req.query.email;
      const tasks = await taskCollection.find({ email }).toArray();
      res.send(tasks);
    });

    // Add Task
    app.post('/tasks', async (req, res) => {
      const result = await taskCollection.insertOne(req.body);
      res.send({ insertedId: result.insertedId });

    });

    // Update Task Category
    app.put('/tasks/:id', async (req, res) => {
      const taskId = req.params.id;
  
      // ✅ Validate the ID before converting it to ObjectId
      if (!taskId || taskId.length !== 24) {
          return res.status(400).json({ error: "Invalid task ID format" });
      }
  
      try {
          const filter = { _id: new ObjectId(taskId) };
          const update = { $set: { category: req.body.category } };
          
          const result = await taskCollection.updateOne(filter, update);
          res.send(result);
      } catch (error) {
          console.error("Error updating task:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  });
  

    // Delete Task
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });





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
