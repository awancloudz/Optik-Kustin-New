import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Transaction from "@/models/transaction";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
// import htmlToPdf from 'html-pdf';
import mongoose from "mongoose";

export async function GET(){
    await connectMongoDB();
    const transaction = await Transaction.find();
    return NextResponse.json({transaction},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    const{Data} = await request.json();
    console.log(Data["NAMA CUSTOMER"]);
    const NoNota = Data.NOTA;
    const Tanggal = Data.TANGGAL;
    const RX = Data.RX;
    const IDCustomer = Data["ID MEMBER"];
    const NamaCustomer = Data["NAMA CUSTOMER"];
    const NoHandphone = Data["NO. TELP"];
    const Alamat = Data.ALAMAT;

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = 
    `<html><body>   
    <p align='center'> <b>OPTIK KUSTIN</b><br>Jl. Sirojudin Raya No.37<br>Undip Tembalang - Kota Semarang<br>Telp. 024-76402637 - WA 0813 7757 2015</p>
    <hr>
    <p><b>No :</b> ${NoNota}</p>
    <p><b>Rx :</b> ${RX}</p>
    <p><b>Tanggal Pembelian:</b> ${Tanggal}</p><hr>
    <p><b>No.ID Cust :</b> ${IDCustomer}</p>
    <p><b>Nama :</b> ${NamaCustomer}</p>
    <p><b>Alamat :</b> ${Alamat}</p>
    <p><b>Telp :</b> ${NoHandphone}</p><hr>
    <table>
    <tr>
    <th>Keterangan</th><th>Harga</th><th>Diskon</th>
    </tr>
    <table>
    </body></html>`;
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A6', printBackground: true });
    await browser.close();

    // Save the PDF to a file
    const pdfPath = path.join(process.cwd(), 'public/pdf/', 'nota_'+`${NoNota}`+'.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    const FilePDF = 'nota_'+`${NoNota}`+'.pdf';
    Data.FilePDF = FilePDF;

    //Save Data to MongoDB
    await connectMongoDB();
    await Transaction.create([{NoNota, Tanggal, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, FilePDF}]);
    mongoose.connection.close()

    //Send PDF to Whatsapp
    await fetch("http://localhost:8000/transaction",{
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({NoNota, Tanggal, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, FilePDF}),
    });

    //Respon
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}