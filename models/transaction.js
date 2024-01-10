import mongoose, {Schema} from "mongoose";

const transactionSchema = new Schema(
    {
        JenisTransaksi: String,
        Cabang: String,
        NoNota: String,
        Keterangan: String,
        Tanggal: Date,
        NamaCustomer: String,
        NoHandphone: String,
        FilePDF: String,
        FilePDF2: String
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;