import mongoose, {Schema} from "mongoose";

const pemesananSchema = new Schema(
    {
        JenisTransaksi: String,
        Cabang: String,
        RX: String,
        NoNota: String,
        TanggalPesan: String,
        TanggalSelesai: String,
        IDCustomer: String,
        NamaCustomer: String,
        Alamat: String,
        NoHandphone: String,
        Umur: String,
        JenisKelamin: String,
        SKUFrame: String,
        Frame: String,
        HargaFrame: String,
        DiskonFrame: String,
        JumlahFrame: String,
        SKULensa: String,
        Lensa: String,
        HargaLensa: String,
        DiskonLensa: String,
        JumlahLensa: String,
        SubTotal: String,
        Diskon: String,
        DiskonTambahan: String,
        Total: String,
        UangMuka: String,
        JenisPembayaran: String,
        Sisa: String,
        FilePDF: String
    },
    {
        timestamps: true,
    }
);

const Pemesanan = mongoose.models.Pemesanan || mongoose.model("Pemesanan", pemesananSchema);

export default Pemesanan;