import { NextResponse } from "next/server";

export async function POST(request){
    //Capture Data from AppSheet
    const{STORE, RX} = await request.json();
    await fetch("http://localhost:8000/transaction/scanwa",{
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({STORE,RX}),
    });
    //Response
    return NextResponse.json({message: "Whatsapp Sudah diaktifkan!",STORE, RX},{status:201});
}