import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Penjualan from "@/models/penjualan";

export async function GET(request, {params}){
    const { id } = params;
    await connectMongoDB();
    const penjualan = await Penjualan.findOne({NoNota: id});

    return NextResponse.json({penjualan}, {status: 200});
}