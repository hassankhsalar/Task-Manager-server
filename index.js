require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobtask.cuo7r.mongodb.net/?retryWrites=true&w=majority&appName=jobtask`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
       // await client.connect();
        const taskCollection = client.db("JobTasks").collection("task");
        const userCollection = client.db("JobTasks").collection("users");

        // Handle WebSocket connections
        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);
            socket.on("taskMoved", async ({ taskId, category, createdAt }) => {
                console.log("Received taskId:", taskId); // Log the taskId for debugging
              
                try {
                  // Ensure taskId is a valid ObjectId
                  if (!ObjectId.isValid(taskId)) {
                    console.error("Invalid taskId:", taskId);
                    return;
                  }
              
                  const updatedTask = await taskCollection.findOneAndUpdate(
                    { _id: new ObjectId(taskId) }, // Convert taskId to ObjectId
                    { $set: { category, createdAt } }, // Update fields
                    { returnDocument: "after" } // Return the updated document
                  );
              
                  if (updatedTask.value) {
                    io.emit("taskUpdated", updatedTask.value); // Emit the updated task
                  } else {
                    console.error("Task not found or not updated:", taskId);
                  }
                } catch (error) {
                  console.error("Error updating task:", error);
                }
              });

            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
            });
        });

        //user related API
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


        app.get('/users', async (req, res) => {
            const email = req.query.email;
        
            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }
        
            try {
                const user = await userCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.json(user);
            } catch (error) {
                console.error("Error fetching user data:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        // Get Tasks by User
        app.get("/tasks", async (req, res) => {
            const email = req.query.email;
            const tasks = await taskCollection
              .find({ email }) // Fetch only tasks for the user
              .sort({ createdAt: -1 }) // Sort by latest created task
              .toArray();
          
            res.send(tasks);
          });
          

        // Add Task
        app.post('/tasks', async (req, res) => {
            const result = await taskCollection.insertOne(req.body);
            res.send({ insertedId: result.insertedId });
        });

        // Delete Task
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });
        //update task
        app.patch("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            const { category, createdAt } = req.body;
          
            const result = await taskCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: { category, createdAt } }
            );
          
            res.send(result);
          });
          

        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Job task API is running...");
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
