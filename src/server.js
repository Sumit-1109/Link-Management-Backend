const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDB')
const authRoutes = require('./routes/auth.route');
const linkRoutes = require('./routes/link.route');
const redirectRoute = require('./routes/redirectRoute');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());
app.use('*', cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use('/api/user', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api', redirectRoute);

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