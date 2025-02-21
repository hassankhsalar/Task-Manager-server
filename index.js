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
        await client.connect();
        const taskCollection = client.db("JobTasks").collection("task");
        const userCollection = client.db("JobTasks").collection("users");

        // Handle WebSocket connections
        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            socket.on("taskMoved", async ({ taskId, category, createdAt }) => {
                try {
                    const updatedTask = await taskCollection.findOneAndUpdate(
                        { _id: new ObjectId(taskId) },
                        { $set: { category, createdAt } },
                        { returnDocument: "after" }
                    );
                    
                    if (updatedTask.value) {
                        io.emit("taskUpdated", updatedTask.value); // Send update to all clients
                    }
                } catch (error) {
                    console.error("Error updating task:", error);
                }
            });

            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
            });
        });

        // Get Tasks by User
        app.get('/tasks', async (req, res) => {
            const tasks = await taskCollection.find().sort({ position: 1 }).toArray();
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
