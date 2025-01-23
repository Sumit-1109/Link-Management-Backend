const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Successfully connected to MongoDB: ${conn.connection.host}`)
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err}`);
        process.exit(1);
    }
};

module.exports = connectDB;