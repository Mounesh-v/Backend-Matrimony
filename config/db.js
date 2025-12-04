import mongose from "mongoose";

export const ConnectDb = async () => {
  try {
    const connect = await mongose.connect(process.env.URI);
    console.log("Connected to Db ")
  } catch (err) {
    console.log("Error Connect Db");
  }
};

export default ConnectDb; 