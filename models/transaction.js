import mongoose, {Schema} from "mongoose";

const transactionSchema = new Schema(
    {
        NoNota: String,
        Keterangan: String,
        Tanggal: Date,
        NamaCustomer: String,
        NoHandphone: String,
        FilePDF: String
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;