import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Pemesanan from "@/models/pemesanan";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
// import htmlToPdf from 'html-pdf';
import mongoose from "mongoose";
import bwipjs from "bwip-js";
import Image from "next/image";
import Customer from "@/models/customer";

export async function GET(){
    await connectMongoDB();
    const pemesanan = await Pemesanan.find();
    return NextResponse.json({pemesanan},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    //const{Data, TableName} = await request.json();
    const Data = await request.json();
    //Jenis Transaksi
    const JenisTransaksi = Data.jenistransaksi;
    //Deteksi Cabang
    const Cabang = Data.profile.nama;
    const AlamatCabang = Data.profile.alamat;
    const KotaCabang = Data.profile.kota; 
    const TelpCabang = Data.profile.notelp;

    //Data Utama
    const NoNota = Data.kodetransaksi;
    const TanggalPesan = Data.tanggaltransaksi;
    const TanggalSelesai = Data.tanggalselesai;
    const RX = Data.karyawan.nama;
    const IDCustomer = Data.customer.kodecustomer;
    const NamaCustomer = Data.customer.nama;
    const NoHandphone = Data.customer.notelp;
    const Alamat = Data.customer.alamat;      
    const TanggalLahir = Data.customer.tanggallahir;
    const JenisKelamin = (Data.customer.jeniskelamin).toUpperCase();
    const Umur = Data.customer.umur;
    
    //Format Date
    const dateformatID = (tanggal) => {
        const tgl = new Date(tanggal);
        const yyyy = tgl.getFullYear();
        let mm = tgl.getMonth() + 1; // Months start at 0!
        let dd = tgl.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedToday = dd + '/' + mm + '/' + yyyy;
        return formattedToday;
    }
    //Fungsi Convert Rupiah to Number
    const rupiahToNumber = (rupiahString) => {
        // Hapus karakter non-numeric dari string
        const numericString = rupiahString.replace(/[^0-9,-]/g, '');
        // Konversi string yang telah dibersihkan menjadi tipe data number
        const numericValue = parseFloat(numericString.replace(',', '.'));
        return isNaN(numericValue) ? 0 : numericValue;
    }

    const Jumlah1 = Data.detailtransaksi[0].total;
    const Jumlah2 = Data.detailtransaksi[1].total;

    //Fungsi Convert Number to Rupiah
    const numberToRupiah = (number) => {
        const formatter = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        });      
        return formatter.format(number);
    }

    //Data Pesanan
    const SKUFrame = Data.detailtransaksi[0].produk.kodeproduk;
    const Frame = Data.detailtransaksi[0].produk.namaproduk;
    const HargaFrame = numberToRupiah(Data.detailtransaksi[0].produk.hargajual);
    const DiskonFrame = Data.detailtransaksi[0].produk.diskon + "%";
    const JumlahFrame = numberToRupiah(Jumlah1);

    const SKULensa = Data.detailtransaksi[1].produk.kodeproduk;
    const Lensa = Data.detailtransaksi[1].produk.namaproduk;
    const HargaLensa = numberToRupiah(Data.detailtransaksi[1].produk.hargajual);
    const DiskonLensa = Data.detailtransaksi[1].produk.diskon + "%";
    const JumlahLensa = numberToRupiah(Jumlah2);

    const SubTotal = numberToRupiah(Data.totalbelanja);
    const Diskon = numberToRupiah(Data.totaldiskon);
    const DiskonTambahan = "-";
    const Total = numberToRupiah(Data.subtotal);
    const UangMuka = numberToRupiah(Data.bayar);
    const JenisPembayaran = (Data.metode).toUpperCase();
    const Sisa = numberToRupiah(Data.sisa);

    if(SKUFrame != ""){
        var produk1 = `<tr><td>${Frame}</td><td align='right'>${HargaFrame}</td><td align='center'>${DiskonFrame}</td><td align='right'>${JumlahFrame}</td></tr>`;
    }
    else{
        var produk1 = ``;
    }
    if(SKULensa != ""){
        var produk2 = `<tr><td>${Lensa}</td><td align='right'>${HargaLensa}</td><td align='center'>${DiskonLensa}</td><td align='right'>${JumlahLensa}</td></tr>`;
    }
    else{
        var produk2 = ``;
    }

    //Barcode Generator
    bwipjs.toBuffer({
        bcid: 'code39',       // Barcode type
        text: NoNota,            // Text to encode
        scale: 3,               // 3x scaling factor
        height: 10,              // Bar height, in millimeters
        //includetext: true,            // Show human-readable text
        textxalign: 'center',        // Always good to set this
    })
    .then(png => {
        png.readUInt32BE(16);// PNG image width
        png.readUInt32BE(20);// PNG image height
        const pngPath = path.join(process.cwd(), 'public/png/', 'nota'+`${NoNota}`+'.png');
        fs.writeFileSync(pngPath, png);
    })
    .catch(err => {
        // `err` may be a string or Error object
    });
    const FilePNG = '<Image src="http://103.31.39.135:3000/png/nota'+`${NoNota}`+'.png" />';
    //const FilePNG = '<Image src="http://localhost:3000/png/nota'+`${NoNota}`+'.png" />';
    //const FilePNGKartu = '<Image width="25%" src="http://localhost:3000/png/nota'+`${NoNota}`+'.png" align="center"/>';
    // Generate PDF Nota Transaksi
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = 
    `<html>
    <head>
    </head>
    <body style='font-family: Arial, Helvetica, sans-serif;'> 
    <p align='center'>${FilePNG}</p>
    <p align='center'><b>OPTIK KUSTIN</b><br>${AlamatCabang}<br>${KotaCabang}<br>${TelpCabang}</p>
    <hr style='border-top: 1px dotted black;'> 
    <table width='100%'>
    <tr><td width='30%'><b>No</b></td><td colspan='2'>: ${NoNota}</td><tr>
    <tr><td><b>Rx</b></td><td colspan='2'>: ${RX}</td><tr>
    <tr><td><b>Tgl. Pembelian</b></td><td colspan='2'>: ${dateformatID(TanggalPesan)}</td><tr>
    <tr><td><b>Tgl. Selesai</b></td><td colspan='2'>: ${dateformatID(TanggalSelesai)}</td><tr>
    <tr><td colspan='3'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td><b>No.ID Cust</b></td><td colspan='2'>: ${IDCustomer}</td><tr></tr>
    <tr><td><b>Nama</b></td><td colspan='2'>: ${NamaCustomer}</td><tr>
    <tr><td style='vertical-align: top;'><b>Alamat</b></td><td align='left' style='vertical-align: top;'>: </td><td style='word-wrap: break-word;width: 500px;'>${Alamat}</td><tr>
    <tr><td><b>Telp</b></td><td colspan='2'>: ${NoHandphone}</td><tr>
    <tr><td><b>Umur</b></td><td colspan='2'>: ${Umur}</td><tr>
    <tr><td><b>Jenis Kelamin</b></td><td colspan='2'>: ${JenisKelamin}</td><tr>
    </table>
    <table width='100%' align='center'>
    <tr><td colspan='4'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr><th>Keterangan</th><th>Harga</th><th>Diskon</th><th>Jumlah</th></tr>
    <tr><td colspan='4'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    ${produk1}
    ${produk2}
    <tr><td colspan='4'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td></td><td colspan='2'>SUB TOTAL</td><td align='right'>${SubTotal}</td></tr>
    <tr><td></td><td colspan='2'>DISKON</td><td align='right'>${Diskon}</td></tr>
    <tr><td></td><td colspan='2'>DISKON TAMBAHAN</td><td align='right'>${DiskonTambahan}</td></tr>
    <tr><td></td><td colspan='3'><hr style='border-top: 1px dotted black;'></td></tr>
    <tr><td></td><td colspan='2'>TOTAL</td><td align='right'>${Total}<br></td></tr>
    <tr><td></td><td colspan='2'>UANG MUKA</td><td align='right'>${UangMuka}<br></td></tr>
    <tr><td></td><td colspan='2'>PEMBAYARAN</td><td align='right'>${JenisPembayaran}</td></tr>
    <tr><td></td><td colspan='2'>SISA</td><td align='right'>${Sisa}</td></tr>
    <tr><td></td><td colspan='2'>Anda Hemat</td><td align='right'>${Diskon}</td></tr>
    </table><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'>
    <p align='center'><b>TERIMA KASIH</b></p>
    <p>* Barang yang sudah dibeli tidak dapat ditukar/dikembalikan, uang muka tidak dapat di kembalikan.<br>
    * Barang yang tidak diambil setelah 3 bulan diluar tanggung jawab kami.<br>
    * Kritik dan saran hub. ${TelpCabang}
    </p>
    </body></html>`;   
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ 
        //format: 'A5', 
        margin: { top: 10, bottom: 0, right: 10, left: 7 },
        height: '297mm',
        width:'80mm',
        printBackground: true
    });
    await browser.close();
    
    // Save the PDF to a file
    const pdfPath = path.join(process.cwd(), 'public/pdf/', 'notapemesanan_'+`${NoNota}`+'.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    var FilePDF = 'notapemesanan_'+`${NoNota}`+'.pdf';
    Data.FilePDF = FilePDF;
    console.log("Generate PDF Sukses!");    
    
    //Save Data to MongoDB
    await connectMongoDB();
    if(Data["STATUS CUSTOMER"] == "NON MEMBER"){
        await Customer.create([{IDCustomer, NamaCustomer, Alamat, NoHandphone, Umur, JenisKelamin}]);
        console.log("Data Customer Baru Tersimpan!");
    }    
    await Pemesanan.create([{JenisTransaksi, Cabang, NoNota, TanggalPesan, TanggalSelesai, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, Umur, JenisKelamin, SKUFrame, Frame, HargaFrame, DiskonFrame, JumlahFrame, SKULensa, Lensa, HargaLensa, DiskonLensa, JumlahLensa, SubTotal, Diskon, DiskonTambahan, Total, UangMuka, JenisPembayaran, Sisa, FilePDF}]);
    mongoose.connection.close()
    console.log("Data Pemesanan Tersimpan!");

    //Send PDF to Whatsapp
    const sendWA = async() => {
        await fetch("http://localhost:8000/transaction",{
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({JenisTransaksi, Cabang, NoNota, TanggalPesan, TanggalSelesai, RX, IDCustomer, NamaCustomer, Alamat, NoHandphone, FilePDF}),
        });
    }
    await sendWA();

    //Response
    return NextResponse.json({message: "Nota PDF Terkirim",Data},{status:201}
    );    
}
