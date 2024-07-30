const mongoose = require('mongoose');
RAZORPAY_API_KEY= "rzp_test_WzXiPsEdUINLWN";
RAZORPAY_APT_SECRET="0BroyffuH6bL9hissvxc5ZaD";
const mongoURI = "mongodb://localhost:27017/MrDelicious";

module.exports = async function () {
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true });
        console.log("Connected to MongoDB");

        const foodCollection = mongoose.connection.db.collection("food_items");
        const categoryCollection = mongoose.connection.db.collection("foodcategory");

        const data = await foodCollection.find({}).toArray();
        const CatData = await categoryCollection.find({}).toArray();

        return { data, CatData };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};
