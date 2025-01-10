require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;

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
        db = client.db("Users")
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    } 
}

const getUser = async (telegramID) => {
    if (!db) { return }
    let collection = await db.collection("Users");
    const user = await collection.findOne({ telegramID: telegramID });
    return user;
}

const isUserExists = async (telegramID) => {
    const user = await getUser(telegramID);
    return !!user;
}

const isUserPaid = async (telegramID) => {
    const user = await getUser(telegramID);

    if (!user || !user.paidUntil) {
        return false;
    }

    const now = new Date();
    const paidUntil = new Date(user.paidUntil);
    return paidUntil > now;
}

const isUserAdmin = async (telegramID) => {
    const user = await getUser(telegramID);
    if (!user) {
        return false;
    }
    return user.role === 1 || user.role === 2
}

const isUserSuperAdmin = async (telegramID) => {
    const user = await getUser(telegramID);
    if (!user) {
        return false;
    }
    return user.role === 1
}

const isUserHasTokens = async (telegramID) => {
    const user =  await getUser(telegramID);
    if (!user || !user.tokens) {
        return false;
    }
    return tokens > 0
}

const createUser = async (user) => {
    if (!db) { return false }
    let collection = await db.collection("Users");
    const { chatID, telegramID, isAiMarketing, role, createData, paidUntil, isUsingOwnKey, currentModel, temperature, tokens } = user;
    const data = {
        chatID,
        telegramID,
        isAiMarketing,
        role,
        createData,
        paidUntil,
        isUsingOwnKey,
        currentModel,
        temperature,
        tokens
    };
    try {
        let result = await collection.insertOne(data);
        return result ? true : false
    } catch (e) {
        console.log(e)
        return false
    }
}

process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection');
    await client.close();
    process.exit(0);
});

module.exports = { connectDB, createUser, isUserExists, isUserPaid, isUserHasTokens, isUserAdmin, isUserSuperAdmin };