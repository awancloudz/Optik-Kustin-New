import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Pemesanan from "@/models/pemesanan";
import ResepKacamata from "@/models/resepkacamata";
import mongoose from "mongoose";

export async function GET(request, {params}){
    const { id } = params;
    await connectMongoDB();
    const pemesanan = await Pemesanan.findOne({NoNota: id});

    return NextResponse.json({pemesanan}, {status: 200});
}

export async function POST(request){
    const{Data, TableName} = await request.json();
    const JenisTransaksi = TableName;
    const NoNota = Data.NOTA;

    //Variable Resep
    const SPHRight = Data["SPH RIGHT"];
    const SPHLeft = Data["SPH LEFT"];
    const CYLRight = Data["CYL RIGHT"];
    const CYLLeft = Data["CYL LEFT"];
    const AXISRight = Data["AXIS RIGHT"];
    const AXISLeft = Data["AXIS LEFT"];
    const ADD = Data["ADD"];
    const PD = Data["PD"];
    const A = Data["A"];
    const B = Data["B"];
    const DBL = Data["DBL"];
    const MPD = Data["MPD"];
    const SHPV = Data["SH/VP"];
    const JenisFrame = Data["JENIS FRAME"];
    const Corridor = Data["CORRIDOR"];
    const DukeElder = Data["DUKE ELDER"];
    const VisusBalancing = Data["VISUS BALANCING"];
    const WrapAngle = Data["WRAP ANGLE"];
    const Pantoscopik = Data["PANTOSCOPIK"];
    const VertexDistance = Data["VERTEX DISTANCE"];
    const CatatanResep = Data["CATATAN RESEP"];



    //Pencarian Data Nota Pemesanan
    await connectMongoDB();
    const DataPesanan = await Pemesanan.findOne({NoNota: NoNota});
    if(DataPesanan != null){
        console.log("Data Nota Ditemukan!")
        const Cabang = DataPesanan.Cabang;        
        if(Cabang == "TEMBALANG"){
            var serverLokal = "https://honestly-certain-dingo.ngrok-free.app/api/print/suratorder";
        }        

        //Kirim Data Ke Proxy Lokal (Cetak SO)
        const sendToProxy = async() => {
            await fetch(`${serverLokal}`,{
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify({Data}),
            });
        }

        //Simpan Data Resep Kacamata
        if(JenisTransaksi == 'INPUT RESEP KACAMATA'){
            await ResepKacamata.create([{JenisTransaksi, Cabang, NoNota, SPHRight, SPHLeft, CYLRight, CYLLeft, AXISRight, AXISLeft, ADD, PD, A, B, DBL, MPD, SHPV, JenisFrame, Corridor, DukeElder, VisusBalancing, WrapAngle, Pantoscopik, VertexDistance, CatatanResep}]);    
            mongoose.connection.close()    
            await sendToProxy();
            console.log("Data Resep Tersimpan & Tercetak!")
        }  
    }      
    else{
        console.log("Data Nota TIDAK Ditemukan!")
    }
    
    return NextResponse.json({Data, DataPesanan}, {status: 200});
}