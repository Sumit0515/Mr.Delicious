const express = require('express');
const User = require('../models/User');
const Order = require('../models/Orders');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fetch = require('../middleware/fetchdetails');
const jwtSecret = "HaHa";

// Creating a user and storing data to MongoDB Atlas, No Login Required
router.post('/createuser', [
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('name').isLength({ min: 3 }),
    body('location').not().isEmpty()  // Adding validation for location
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password, name, location } = req.body;
    const salt = await bcrypt.genSalt(10);
    const securePass = await bcrypt.hash(password, salt);

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success, error: "User already exists" });
        }

        user = new User({
            name,
            email,
            password: securePass,
            location
        });

        await user.save();

        const data = {
            user: {
                id: user.id
            }
        };
        const authToken = jwt.sign(data, jwtSecret);
        success = true;
        res.json({ success, authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Authenticating a user, No login required
router.post('/login', [
    body('email', "Enter a Valid Email").isEmail(),
    body('password', "Password cannot be blank").exists(),
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "Try logging in with correct credentials" });
        }

        const pwdCompare = await bcrypt.compare(password, user.password);
        if (!pwdCompare) {
            return res.status(400).json({ success, error: "Try logging in with correct credentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        };
        const authToken = jwt.sign(data, jwtSecret);
        success = true;
        res.json({ success, authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Get logged in user details, login required
router.post('/getuser', fetch, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Get user location, no login required
router.post('/getlocation', async (req, res) => {
    try {
        const { lat, long } = req.body.latlong;
        const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${long}&key=74c89b3be64946ac96d777d08b878d43`);
        const { village, county, state_district, state, postcode } = response.data.results[0].components;
        const location = `${village}, ${county}, ${state_district}, ${state}\n${postcode}`;
        res.json({ location });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Get food data, no login required
router.post('/foodData', async (req, res) => {
    try {
        res.json([global.foodData, global.foodCategory]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Add order data, no login required
router.post('/orderData', async (req, res) => {
    const { email, order_data, order_date } = req.body;
    const data = [{ Order_date: order_date }, ...order_data];

    try {
        let order = await Order.findOne({ email });
        if (!order) {
            order = new Order({
                email,
                order_data: [data]
            });
            await order.save();
        } else {
            await Order.findOneAndUpdate(
                { email },
                { $push: { order_data: data } }
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

// Get user's order data, no login required
router.post('/myOrderData', async (req, res) => {
    try {
        const { email } = req.body;
        const order = await Order.findOne({ email });
        res.json({ orderData: order });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

module.exports = router;
