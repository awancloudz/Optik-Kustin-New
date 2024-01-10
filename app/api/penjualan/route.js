import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Penjualan from "@/models/penjualan";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
// import htmlToPdf from 'html-pdf';
import mongoose from "mongoose";
import bwipjs from "bwip-js";

export async function GET(){
    await connectMongoDB();
    const penjualan = await Penjualan.find();
    return NextResponse.json({penjualan},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    const{Data, TableName} = await request.json();

    //Jenis Transaksi
    const JenisTransaksi = TableName;

    //Deteksi Cabang
    const Cabang = Data.STORE;
    if(Cabang == 'TEMBALANG'){
        var AlamatCabang = "Jl. Sirojudin Raya No.37<br>Undip Tembalang - Kota Semarang<br>Telp. 024-76402637 - WA 0813 7757 2015";
        var TelpCabang = "0813 7757 2015";
    }
    if(Cabang == 'UNGARAN'){
        var AlamatCabang = "Jl. Ahmad Yani No. 1B, Ungaran<br>Kab. Semarang<br>Telp. 024-76902181 - WA 0813 7757 2016";
        var TelpCabang = "0813 7757 2016";
    }
    if(Cabang == 'NGALIYAN'){
        var AlamatCabang = "";
        var TelpCabang = "";
    }
    if(Cabang == 'JATISARI'){
        var AlamatCabang = "";
        var TelpCabang = "";
    }
    if(Cabang == 'TEGAL'){
        var AlamatCabang = "";
        var TelpCabang = "";
    }

    //Data Utama
    const NoNota = Data.NOTA;
    const Tanggal = Data.TANGGAL;
    const RX = Data.RX;
    const IDCustomer = Data["ID MEMBER"];
    const NamaCustomer = Data["NAMA CUSTOMER"];
    const NoHandphone = Data["NO. TELP"];
    const Alamat = Data.ALAMAT;    

    //Fungsi Convert Rupiah to Number
    const rupiahToNumber = (rupiahString) => {
        // Hapus karakter non-numeric dari string
        const numericString = rupiahString.replace(/[^0-9,-]/g, '');
        // Konversi string yang telah dibersihkan menjadi tipe data number
        const numericValue = parseFloat(numericString.replace(',', '.'));
        return isNaN(numericValue) ? 0 : numericValue;
    }

    var Diskon1 = (rupiahToNumber(Data["HARGA 1"]) * (rupiahToNumber(Data["DISKON 1"]) / 100)) * Data["QTY 1"];
    var Diskon2 = (rupiahToNumber(Data["HARGA 2"]) * (rupiahToNumber(Data["DISKON 2"]) / 100)) * Data["QTY 2"];
    var Diskon3 = (rupiahToNumber(Data["HARGA 3"]) * (rupiahToNumber(Data["DISKON 3"]) / 100)) * Data["QTY 3"];
    var Diskon4 = (rupiahToNumber(Data["HARGA 4"]) * (rupiahToNumber(Data["DISKON 4"]) / 100)) * Data["QTY 4"];
    var Jumlah1 = (rupiahToNumber(Data["HARGA 1"]) * Data["QTY 1"]) - Diskon1;
    var Jumlah2 = (rupiahToNumber(Data["HARGA 2"]) * Data["QTY 2"]) - Diskon2;
    var Jumlah3 = (rupiahToNumber(Data["HARGA 3"]) * Data["QTY 3"]) - Diskon3;
    var Jumlah4 = (rupiahToNumber(Data["HARGA 4"]) * Data["QTY 4"]) - Diskon4;

    //Fungsi Convert Number to Rupiah
    const numberToRupiah = (number) => {
        const formatter = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        });      
        return formatter.format(number);
    }
    
    //Deteksi Produk
    if(Data["NAMA 1"] != ""){
        var produk1 = `<tr><td>${Data["QTY 1"]}</td><td>${Data["NAMA 1"]}</td><td>${Data["HARGA 1"]}</td><td>${Data["DISKON 1"]}</td><td align='right'>${numberToRupiah(Jumlah1)}</td></tr>`;
    }
    else{
        var produk1 = ``;
    }
    if(Data["NAMA 2"] != ""){
        var produk2 = `<tr><td>${Data["QTY 2"]}</td><td>${Data["NAMA 2"]}</td><td>${Data["HARGA 2"]}</td><td>${Data["DISKON 2"]}</td><td align='right'>${numberToRupiah(Jumlah2)}</td></tr>`;
    }
    else{
        var produk2 = ``;
    }
    if(Data["NAMA 3"] != ""){
        var produk3 = `<tr><td>${Data["QTY 3"]}</td><td>${Data["NAMA 3"]}</td><td>${Data["HARGA 3"]}</td><td>${Data["DISKON 3"]}</td><td align='right'>${numberToRupiah(Jumlah3)}</td></tr>`;
    }
    else{
        var produk3 = ``;
    }
    if(Data["NAMA 4"] != ""){
        var produk2 = `<tr><td>${Data["QTY 2"]}</td><td>${Data["NAMA 2"]}</td><td>${Data["HARGA 2"]}</td><td>${Data["DISKON 2"]}</td><td align='right'>${numberToRupiah(Jumlah4)}</td></tr>`;
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

    //Barcode Generator
    bwipjs.toBuffer({
        bcid: 'code128',       // Barcode type
        text: NoNota,            // Text to encode
        scale: 3,               // 3x scaling factor
        height: 10,              // Bar height, in millimeters
        //includetext: true,            // Show human-readable text
        textxalign: 'center',        // Always good to set this
    })
    .then(png => {
        png.readUInt32BE(16);// PNG image width
        png.readUInt32BE(20);// PNG image height
        const pngPath = path.join(process.cwd(), 'public/png/', 'nota_'+`${NoNota}`+'.png');
        fs.writeFileSync(pngPath, png);
    })
    .catch(err => {
        // `err` may be a string or Error object
    });
    //const FilePNG = 'http://103.31.39.135:3000/png/nota_'+`${NoNota}`+'.png';
    const FilePNG = 'http://localhost:3000/png/nota_'+`${NoNota}`+'.png';

    // Generate PDF Nota Transaksi
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = 
    `<html>
    <head>
    </head>
    <body style='font-family: Arial, Helvetica, sans-serif;'> 
    <p align='center'><img src='${FilePNG}'/><br>
    <b>OPTIK KUSTIN</b><br>${AlamatCabang}</p>
    <hr style='border-top: 1px dotted black;'> 
    <table width='100%' >
    <tr><td width='25%'><b>No</b></td><td width='50%'>: ${NoNota}</td><tr>
    <tr><td><b>Rx</b></td><td>: ${RX}</td><tr>
    <tr><td><b>Tanggal Pembelian</b></td><td>: ${Tanggal}</td><tr>
    <tr><td colspan='2'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td><b>No.ID Cust</b></td><td>: ${IDCustomer}</td><tr>
    <tr><td><b>Nama</b></td><td>: ${NamaCustomer}</td><tr>
    <tr><td><b>Alamat</b></td><td>: ${Alamat}</td><tr>
    <tr><td><b>Telp</b></td><td>: ${NoHandphone}</td><tr>
    </table>
    <table width='100%' align='center'>
    <tr><td colspan='5'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr><th>Jm</th><th>Nama Barang</th><th>Harga</th><th>Diskon</th><th>Jumlah</th></tr>
    <tr><td colspan='5'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    ${produk1}
    ${produk2}
    ${produk3}
    ${produk4}
    <tr><td colspan='5'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>SUB TOTAL</td><td align='right'>${Data.SUBTOTAL}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>DISKON</td><td align='right'>${Data.DISKON}</td></tr>
    <tr><td colspan='2'></td><td colspan='3'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>TOTAL</td><td align='right'>${Data.TOTAL}<br></td></tr>
    <tr><td colspan='2'></td><td colspan='2'>NON TUNAI</td><td align='right'>${NonTunai}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>TUNAI</td><td align='right'>${Tunai}</td></tr>
    <tr><td colspan='2'></td><td colspan='2'>Anda Hemat</td><td align='right'>-</td></tr>
    <table><hr style='border-top: 1px dotted black;'>
    <p align='center'><b>TERIMA KASIH</b></p>
    <p>* Barang yang sudah dibeli tidak dapat ditukar/dikembalikan, uang muka tidak dapat di kembalikan.<br>
    * Barang yang tidak diambil setelah 3 bulan diluar tanggung jawab kami.<br>
    * Kritik dan saran hub. ${TelpCabang}
    </p>
    </body></html>`;   
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Save the PDF to a file
    const pdfPath = path.join(process.cwd(), 'public/pdf/', 'nota_'+`${NoNota}`+'.pdf');    
    fs.writeFileSync(pdfPath, pdfBuffer);
    var FilePDF = 'nota_'+`${NoNota}`+'.pdf';
    Data.FilePDF = FilePDF;

    //Save Data to MongoDB
    await connectMongoDB();
    await Penjualan.create([{JenisTransaksi, Cabang, NoNota, Tanggal, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, FilePDF}]);
    mongoose.connection.close()

    //Send PDF to Whatsapp
    await fetch("http://localhost:8000/transaction",{
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({JenisTransaksi, Cabang, NoNota, Tanggal, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, FilePDF}),
    });

    //Response
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}