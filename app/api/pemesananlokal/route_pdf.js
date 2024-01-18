import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Pemesanan from "@/models/pemesanan";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function GET(){
    await connectMongoDB();
    const pemesanan = await Pemesanan.find();
    return NextResponse.json({pemesanan},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    const{Data} = await request.json();
  
    //Deteksi Cabang
    const Cabang = Data.STORE;
    //Data Nota
    const NoNota = Data.NOTA;
    const pdfPath = 'http://localhost:3000/pdf/suratorder_'+`${NoNota}`+'.pdf';

    //Popup Cetak
    const browserSO = await puppeteer.launch({headless: false});
    const printSO = await browserSO.newPage();
    await printSO.goto(`${pdfPath}`);
    await printSO.evaluate(() => { window.print(); });

    //Response
    console.log("Nota Toko(localhost) Printed!");
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}