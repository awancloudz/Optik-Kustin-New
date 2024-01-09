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

    //Deteksi Produk
    if(Data["NAMA 1"] != ""){
        var produk1 = `<tr><td>${Data["QTY 1"]}</td><td>${Data["NAMA 1"]}</td><td>${Data["HARGA 1"]}</td><td>${Data["DISKON 1"]}</td><td></td></tr>`;
    }
    else{
        var produk1 = ``;
    }
    if(Data["NAMA 2"] != ""){
        var produk2 = `<tr><td>${Data["QTY 2"]}</td><td>${Data["NAMA 2"]}</td><td>${Data["HARGA 2"]}</td><td>${Data["DISKON 2"]}</td><td></td></tr>`;
    }
    else{
        var produk2 = ``;
    }
    if(Data["NAMA 3"] != ""){
        var produk3 = `<tr><td>${Data["QTY 3"]}</td><td>${Data["NAMA 3"]}</td><td>${Data["HARGA 3"]}</td><td>${Data["DISKON 3"]}</td><td></td></tr>`;
    }
    else{
        var produk3 = ``;
    }
    if(Data["NAMA 4"] != ""){
        var produk2 = `<tr><td>${Data["QTY 2"]}</td><td>${Data["NAMA 2"]}</td><td>${Data["HARGA 2"]}</td><td>${Data["DISKON 2"]}</td><td></td></tr>`;
    }
    else{
        var produk4 = ``;
    }

    //Jenis Pembayaran
    if(Data["JENIS PEMBAYARAN"] == 'TUNAI'){
        var Tunai = Data.PEMBAYARAN;
        var NonTunai = '-';
    }
    else{
        var Tunai = '-';
        var NonTunai = Data.PEMBAYARAN;
    }
    // Generate PDF using puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = 
    `<html>
    <head>
    </head>
    <body style='font-family: Arial, Helvetica, sans-serif;'>   
    <p align='center'> <b>OPTIK KUSTIN</b><br>Jl. Sirojudin Raya No.37<br>Undip Tembalang - Kota Semarang<br>Telp. 024-76402637 - WA 0813 7757 2015</p>
    <hr> 
    <table width='100%' >
    <tr><td width='25%'><b>No</b></td><td width='50%'>: ${NoNota}</td><tr>
    <tr><td><b>Rx</b></td><td>: ${RX}</td><tr>
    <tr><td><b>Tanggal Pembelian</b></td><td>: ${Tanggal}</td><tr>
    <tr><td colspan='2'><hr></td></tr>
    <tr><td><b>No.ID Cust</b></td><td>: ${IDCustomer}</td><tr>
    <tr><td><b>Nama</b></td><td>: ${NamaCustomer}</td><tr>
    <tr><td><b>Alamat</b></td><td>: ${Alamat}</td><tr>
    <tr><td><b>Telp</b></td><td>: ${NoHandphone}</td><tr>
    </table>
    <table width='100%' align='center'>
    <tr><td colspan='5'><hr></td></tr>
    <tr><th>Jm</th><th>Nama Barang</th><th>Harga</th><th>Diskon</th><th>Jumlah</th></tr>
    <tr><td colspan='5'><hr></td></tr>
    ${produk1}
    ${produk2}
    ${produk3}
    ${produk4}
    <tr><td colspan='5'><hr></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>SUB TOTAL</td><td align='right'>${Data.SUBTOTAL}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>DISKON</td><td align='right'>${Data.DISKON}</td></tr>
    <tr><td colspan='2'></td><td colspan='3'><hr></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>TOTAL</td><td align='right'>${Data.TOTAL}<br></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>NON TUNAI</td><td align='right'>${NonTunai}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>TUNAI</td><td align='right'>${Tunai}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>Anda Hemat</td><td align='right'>-</td></tr>
    <table><hr>
    <p align='center'><b>TERIMA KASIH</b></p>
    <p>* Barang yang sudah dibeli tidak dapat ditukar/dikembalikan, uang muka tidak dapat di kembalikan.<br>
    * Barang yang tidak diambil setelah 3 bulan diluar tanggung jawab kami.<br>
    * Kritik dan saran hub. 0813 7757 2016
    </p>
    </body></html>`;
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A5', printBackground: true });
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