import mongoose, {Schema} from "mongoose";

const resepkacamataSchema = new Schema(
    {
        JenisTransaksi: String,
        Cabang: String,
        NoNota: String,
        SPHRight: String,
        SPHLeft: String,
        CYLRight: String,
        CYLLeft: String,
        AXISRight: String,
        AXISLeft: String,
        ADD: String, 
        PD: String, 
        A: String, 
        B: String, 
        DBL: String, 
        MPD: String, 
        SHPV: String, 
        JenisFrame: String, 
        Corridor: String, 
        DukeElder: String, 
        VisusBalancing: String, 
        WrapAngle: String, 
        Pantoscopik: String, 
        VertexDistance: String, 
        CatatanResep: String
    },
    {
        timestamps: true,
    }
);

const ResepKacamata = mongoose.models.ResepKacamata || mongoose.model("ResepKacamata", resepkacamataSchema);

export default ResepKacamata;