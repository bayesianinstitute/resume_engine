import mongoose from "mongoose";

export const connectDB = async (MongoDB_URL) => {
    try {
        await mongoose.connect(MongoDB_URL,{
            dbName: 'Resume',
        }).then(() => {
            console.log("Connected to Database");
        }).catch((err) => {
            console.log("Not Connected to Database ERROR! ", err);
        });
      
    }
    catch (error) {
        console.error("Error connecting to database:", error);
    }
};
