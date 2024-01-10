import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Pemesanan from "@/models/pemesanan";

export async function GET(request, {params}){
    const { id } = params;
    await connectMongoDB();
    const pemesanan = await Pemesanan.findOne({NoNota: id});

    return NextResponse.json({pemesanan}, {status: 200});
}