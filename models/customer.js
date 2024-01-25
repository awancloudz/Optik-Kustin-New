import mongoose, {Schema} from "mongoose";

const customerSchema = new Schema(
    {
        IDCustomer: String, 
        NamaCustomer: String, 
        Alamat: String, 
        NoHandphone: String, 
        Umur: String, 
        JenisKelamin: String,
    },
    {
        timestamps: true,
    }
);

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;