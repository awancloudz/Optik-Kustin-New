import mongoose, {Schema} from "mongoose";

const pemesananSchema = new Schema(
    {
        JenisTransaksi: String,
        Cabang: String,
        RX: String,
        NoNota: String,
        Keterangan: String,
        Tanggal: Date,
        NamaCustomer: String,
        NoHandphone: String,
        FilePDF: String,
        FilePDF2: String,
        FilePDF3: String
    },
    {
        timestamps: true,
    }
);

const Pemesanan = mongoose.models.Pemesanan || mongoose.model("Pemesanan", pemesananSchema);

export default Pemesanan;