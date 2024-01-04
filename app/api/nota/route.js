import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Transaction from "@/models/transaction";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
// import htmlToPdf from 'html-pdf';
import mongoose from "mongoose";

export async function GET(){
    return NextResponse.json({message: "Get Nota"},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    const{Data} = await request.json();
    const NoNota = Data.NoNota;
    const Tanggal = Data.Tanggal;
    const Keterangan = Data.Keterangan;
    const NamaCustomer = Data.NamaCustomer;
    const NoHandphone = Data.NoHandphone;

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = 
    `<html><body>
    <h3>Optik Kustin</h3><hr>
    <p><b>No.Nota :</b> ${NoNota}</p>
    <p><b>Tanggal :</b> ${Tanggal}</p>
    <p><b>Keterangan :</b> ${Keterangan}</p>
    <p><b>Nama :</b> ${NamaCustomer}</p>
    <p><b>No.Handphone :</b> ${NoHandphone}</p>
    </body></html>`;
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Save the PDF to a file
    const pdfPath = path.join(process.cwd(), 'public/pdf/', 'nota_'+`${NoNota}`+'.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    const FilePDF = 'nota_'+`${NoNota}`+'.pdf';
    Data.FilePDF = FilePDF;

    //Save Data to MongoDB
    await connectMongoDB();
    await Transaction.create([{NoNota, Tanggal, Keterangan, NamaCustomer, NoHandphone, FilePDF}]);
    mongoose.connection.close()
    //Respon
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}