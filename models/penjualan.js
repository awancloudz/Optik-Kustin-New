import mongoose, {Schema} from "mongoose";

const penjualanSchema = new Schema(
    {
        JenisTransaksi: String,
        Cabang: String,
        RX: String,
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

const Penjualan = mongoose.models.Penjualan || mongoose.model("Penjualan", penjualanSchema);

export default Penjualan;