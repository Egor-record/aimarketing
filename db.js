require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;
const isProd = process.env.NODE_ENV === 'production';
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
let db;


const connectDB = async () => {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
    
        const dbName = isProd ? 'Users' : 'Users_dev';
        db = client.db(dbName)
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    } 
}

/** 
 * Return User from database.
 * @param {number} telegramID 
 * @returns {User}  
 */
const getUser = async (telegramID) => {
    if (!db) { return }
    let collection = await db.collection("Users");
    const user = await collection.findOne({ telegramID: telegramID });
    return user;
}

const getAdmin = async (telegramID) => {
    if (!db) { return }
    let collection = await db.collection("Admins");
    const user = await collection.findOne({ telegramID: telegramID });
    return user;
}

/** 
 * Create a new user.
 * @param {User} user 
 */
const createUser = async (user) => {
    if (!db) { return false }
    let collection = await db.collection("Users");
    const { telegramID, role, aiMarketing, createData, aibot } = user;
    const data = {
        telegramID,
        role,
        aiMarketing,
        createData,
        aibot
    };
    try {
        return await collection.insertOne(data);
    } catch (e) {
        console.log(e)
        return false
    }
}

const getAllUsers = async () => {
    let collection = await db.collection("Users");
    const users = await collection.find({}).toArray();
    return users;
}

const addServiceToUser = async (telegramID, service, val) => {
    const user = await getUser(telegramID);
    if (!user[service]) {
        const result = await collection.updateOne(
            { telegramID },
            { $set: { [service]: val } }
        );
        console.log('User updated:', result.modifiedCount > 0);
    } 
}

const isUserHasService = async (telegramID, service) => {
    const user = await getUser(telegramID);
    return !!user[service]
}

process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection');
    await client.close();
    process.exit(0);
});

module.exports = { connectDB, createUser, addServiceToUser, isUserHasService, getUser, getAllUsers, getAdmin };