const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDB')
const authRoutes = require('./routes/auth.route');
const linkRoutes = require('./routes/link.route');
const greetingRoute = require('./routes/greeting.route');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

app.use('/api/user', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/greeting', greetingRoute);

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, (err) => {
        if (err) {
            console.error(err);
        }
        console.log(`Server is running successfully on port: ${PORT}`);
    });
}).catch((err) => {
    console.error(err);
})