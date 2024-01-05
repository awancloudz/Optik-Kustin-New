import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Transaction from "@/models/transaction";

export async function GET(request, {params}){
    const { id } = params;
    await connectMongoDB();
    const transaction = await Transaction.findOne({NoNota: id});

    return NextResponse.json({transaction}, {status: 200});
}