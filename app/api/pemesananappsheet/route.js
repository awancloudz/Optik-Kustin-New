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
    const{Data, TableName} = await request.json();

    //Jenis Transaksi
    const JenisTransaksi = TableName;

    //Deteksi Cabang
    const Cabang = Data.STORE;
    if(Cabang == 'TEMBALANG'){
        var AlamatCabang = "Jl. Sirojudin Raya No.37<br>Undip Tembalang - Kota Semarang<br>Telp. 024-76402637 - WA 0813 7757 2015";
        var TelpCabang = "0813 7757 2015";
        //var serverLokal = "https://honestly-certain-dingo.ngrok-free.app/api/pemesananlokal";
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
    const TanggalPesan = Data["TGL PESAN"];
    const TanggalSelesai = Data["TGL SELESAI"];
    const RX = Data.RX;
    const IDCustomer = Data["ID MEMBER"];
    if(IDCustomer != ""){
        var customer = `<tr><td><b>No.ID Cust</b></td><td>: ${IDCustomer}</td><tr></tr>`;
    }
    else{
        var customer = ``;
    }
    const NamaCustomer = Data["NAMA CUSTOMER"];
    const NoHandphone = Data["NO. TELP"];
    const Alamat = Data.ALAMAT;    
    const TanggalLahir = Data["TANGGAL LAHIR"];
    const JenisKelamin = Data["JENIS KELAMIN"];

    // Hitung umur
    var tanggalLahirObj = new Date(TanggalLahir);
    var sekarang = new Date();
    var selisih = sekarang - tanggalLahirObj;
    // Konversi selisih waktu ke tahun, bulan, dan hari
    var tahun = Math.floor(selisih / (365.25 * 24 * 60 * 60 * 1000));
    var bulan = Math.floor((selisih % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    var hari = Math.floor((selisih % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    var Umur = tahun + " Tahun " + bulan + " Bulan " + hari + " Hari";
    Data.Umur = Umur;

    //Fungsi Convert Rupiah to Number
    const rupiahToNumber = (rupiahString) => {
        // Hapus karakter non-numeric dari string
        const numericString = rupiahString.replace(/[^0-9,-]/g, '');
        // Konversi string yang telah dibersihkan menjadi tipe data number
        const numericValue = parseFloat(numericString.replace(',', '.'));
        return isNaN(numericValue) ? 0 : numericValue;
    }

    var Diskon1 = rupiahToNumber(Data["HARGA FRAME"]) * (rupiahToNumber(Data["DISKON FRAME"]) / 100);
    var Diskon2 = rupiahToNumber(Data["HARGA LENSA"]) * (rupiahToNumber(Data["DISKON LENSA"]) / 100);
    var Jumlah1 = rupiahToNumber(Data["HARGA FRAME"]) - Diskon1;
    var Jumlah2 = rupiahToNumber(Data["HARGA LENSA"]) - Diskon2;

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
    const SKUFrame = Data["SKU FRAME"];
    const Frame = Data.FRAME;
    const HargaFrame = Data["HARGA FRAME"];
    const DiskonFrame = Data["DISKON FRAME"];
    const JumlahFrame = numberToRupiah(Jumlah1);

    const SKULensa = Data["SKU LENSA"];
    const Lensa = Data.LENSA;
    const HargaLensa = Data["HARGA LENSA"];
    const DiskonLensa = Data["DISKON LENSA"];
    const JumlahLensa = numberToRupiah(Jumlah2);

    const SubTotal = Data.SUBTOTAL;
    const Diskon = Data.DISKON;
    const DiskonTambahan = Data["DISKON TAMBAHAN"];
    const Total = Data.TOTAL;
    const UangMuka = Data.UANGMUKA;
    const JenisPembayaran = Data["JENIS PEMBAYARAN"];
    const Sisa = Data.SISA;

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
    <p align='center'><b>OPTIK KUSTIN</b><br>${AlamatCabang}</p>
    <hr style='border-top: 1px dotted black;'> 
    <table width='100%'>
    <tr><td width='30%'><b>No</b></td><td colspan='2'>: ${NoNota}</td><tr>
    <tr><td><b>Rx</b></td><td colspan='2'>: ${RX}</td><tr>
    <tr><td><b>Tgl. Pembelian</b></td><td colspan='2'>: ${TanggalPesan}</td><tr>
    <tr><td><b>Tgl. Selesai</b></td><td colspan='2'>: ${TanggalSelesai}</td><tr>
    <tr><td colspan='3'><hr style='border-top: 1px dotted black;'></td></tr>
    ${customer}
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

    // Generate PDF Kartu Garansi
    /*const browser2 = await puppeteer.launch();
    const page2 = await browser2.newPage();
    const htmlContent2 = 
    `<html style='background: white;'>
    <head>
    </head>
    <body style='font-family: Arial, Helvetica, sans-serif;'>     
    <table width='100%' style='background-color:#ededed;border-radius: 20px;padding-left:10px;padding-right:10px;padding-bottom:10px;'>
    <tr><td><h4><br>GUARANTEE CARD</h4></td><td colspan='2' style='vertical-align: middle;text-align:center;'><img width='40%' src='http://localhost:3000/logo/watermark.png'/></td></tr>
    ${customer}
    <tr><td width='35%'><b>Nama</b></td><td colspan='2'>: ${NamaCustomer}</td><tr>
    <tr><td style='vertical-align: top;'><b>Alamat</b></td><td align='left' style='vertical-align: top;'>: </td><td style='word-wrap: break-word;width: 500px;'>${Alamat}</td><tr>
    <tr><td><b>Telp</b></td><td colspan='2'>: ${NoHandphone}</td><tr>
    <tr><td><b>No / Date</b></td><td colspan='2' style='vertical-align: top;'>: ${NoNota} / ${TanggalSelesai} ${FilePNGKartu}</td><tr>
    <tr><td><b>R/ OD</b></td><td colspan='2'>: ${Data["SPH RIGHT"]} ${Data["CYL RIGHT"]} ${Data["AXIS RIGHT"]}</td><tr>
    <tr><td><b>L/ OD</b></td><td colspan='2'>:  ${Data["SPH LEFT"]} ${Data["CYL LEFT"]} ${Data["AXIS LEFT"]}</td><tr>
    <tr><td><b>ADD</b></td><td colspan='2'>: ${Data.ADD}</td><tr>
    <tr><td><b>PD</b></td><td colspan='2'>: ${Data.PD}</td><tr>
    <tr><td><b>Lens</b></td><td colspan='2'>: ${Data.LENSA}</td><tr>
    <tr><td><b>Frame</b></td><td colspan='2'>: ${Data.FRAME}</td><tr>
    <tr><td colspan='3' align='center' style='font-size:11;'><br>* Kartu GARANSI memberikan __ bulan pelayanan gratis untuk pengelupasan lapisan anti refleksi (peeling) yang disebabkan kesalahan produksi. * Garansi tidak termasuk kerusakan akibat terkena bahan kimia, goresan benda keras, benturan dan suhu panas. * Proses klaim harus menunjukan kartu ini.</td></tr>
    </table>
    </body></html>`;   
    await page2.setContent(htmlContent2);
    const pdfBuffer2 = await page2.pdf({ 
        format: 'A5', 
        margin: { top: 10, bottom: 0, right: 10, left: 10 },
        printBackground: true 
    });
    await browser2.close();*/

    // Generate PDF Nota Transaksi
    /*const browser3 = await puppeteer.launch();
    const page3 = await browser3.newPage();
    const htmlContent3 = 
    `<html>
    <head>
    </head>
    <body style='font-family: "Arial Narrow";font-size:19px;'> 
    <p align='center'>${FilePNG}</p>
    <p align='center'><b>OPTIK KUSTIN</b><br>${AlamatCabang}</p>
    <hr style='border-top: 1px dotted black;'> 
    <table width='100%' style='font-family: "Arial Narrow";font-size:19px;'>
    <tr><td width='30%'>No</td><td colspan='2'>: ${NoNota}</td><tr>
    <tr><td>Rx</td><td colspan='2'>: ${RX}</td><tr>
    <tr><td>Tgl. Pembelian</td><td colspan='2'>: ${TanggalPesan}</td><tr>
    <tr><td>Tgl. Selesai</td><td colspan='2'>: ${TanggalSelesai}</td><tr>
    <tr><td colspan='3'><hr style='border-top: 1px dotted black;'></td></tr>
    ${customer}
    <tr><td>Nama</td><td colspan='2'>: ${NamaCustomer}</td><tr>
    <tr><td style='vertical-align: top;'>Alamat</td><td align='left' style='vertical-align: top;'>: </td><td style='word-wrap: break-word;width: 500px;'>${Alamat}</td><tr>
    <tr><td>Telp</td><td colspan='2'>: ${NoHandphone}</td><tr>
    <tr><td>Umur</td><td colspan='2'>: ${Umur}</td><tr>
    <tr><td>Jenis Kelamin</td><td colspan='2'>: ${JenisKelamin}</td><tr>
    </table>
    <table width='100%' align='center' style='font-family: "Arial Narrow";font-size:19px;'>
    <tr><td colspan='7'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr><th></th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th><th>PD</th><th>Vis Akhir</th></tr>
    <tr><td colspan='7'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr align='center'><td>R</td><td>${Data["SPH RIGHT"]}</td><td>${Data["CYL RIGHT"]}</td><td>${Data["AXIS RIGHT"]}</td><td rowspan='2'>${Data.ADD}</td><td rowspan='2'>${Data.PD}</td><td>6/6</td></tr>
    <tr align='center'><td>L</td><td>${Data["SPH RIGHT"]}</td><td>${Data["CYL RIGHT"]}</td><td>${Data["AXIS RIGHT"]}</td><td>6/6</td></tr>
    <tr><td colspan='7'><hr style='border-top: 1px dotted black;'></td></tr>
    </table>
    <table width='100%' style='font-family: "Arial Narrow";font-size:19px;'>
    <tr><td width='25%'>Jenis Frame</td><td>: ${Data["JENIS FRAME"]}</td><td>Wrap Angle</td><td>: ${Data["WRAP ANGLE"]}</td><tr>
    <tr><td>Koridor</td><td>: ${Data.CORRIDOR}</td><td>Pantoskopik</td><td>: ${Data.PANTOSCOPIK}</td><tr>
    <tr><td>Visus Balance</td><td>: ${Data["VISUS BALANCING"]}</td><td>Vertex Distance</td><td>: ${Data["VERTEX DISTANCE"]}</td><tr>
    <tr><td>Duke Elder</td><td>: ${Data["DUKE ELDER"]}</td><td>Catatan Resep</td><td>: ${Data["CATATAN RESEP"]}</td><tr>
    <tr><td colspan='4'><hr style='border-top: 1px dotted black;'></td></tr>
    </table>    
    <table width='100%' align='center' style='font-family: "Arial Narrow";font-size:19px;'>
    <tr><td colspan='5'><p><b>PRECAL:</b></p></td></tr>
    <tr><td colspan='5'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr><th>A</th><th>B</th><th>DBL</th><th>MPD</th><th>SH/PV</th></tr>
    <tr><td colspan='5'><hr style='border-top: 1px solid black;border-bottom: 1px solid black;height:1px;'></td></tr>
    <tr align='center'><td>${Data.A}</td><td>${Data.B}</td><td>${Data.DBL}</td><td>${Data.MPD}</td><td>${Data["SH/PV"]}</td></tr>
    </table><br>
    <table width='100%' align='center' style='font-family: "Arial Narrow";font-size:19px;'>
    <tr><td width='25%'><b>Frame</b></td><td colspan='2'>: ${Data.FRAME}</td><tr>
    <tr><td><b>Lensa</b></td><td colspan='2'>: ${Data.LENSA}</td><tr>
    <tr><td><b>Total</b></td><td colspan='2'>: ${Data.TOTAL}</td><tr>
    <tr><td><b>DP</b></td><td colspan='2'>: ${Data.UANGMUKA}</td><tr>
    <tr><td><b>Sisa</b></td><td colspan='2'>: ${Data.SISA}</td><tr>
    </table>
    <h2 align='center'>${Cabang}</h2>
    <table width='100%' style='border-collapse: collapse;border: 1px solid black;font-family: "Arial Narrow";font-size:19px;'>
    <tr><td width='50%' align='center'><br>Edger</td><td width='50%' align='center'><br>Quality Control</td></tr>
    <tr><td align='center'><br><br><br></td><td align='center'><br><br><br></td></tr>
    <tr><td align='center'>(...............)</td><td align='center'>(...............)</td></tr>
    <tr><td align='center'><br><br>Yang Menyerahkan</td><td width='50%' align='center'><br><br>Penerima</td></tr>
    <tr><td align='center'><br><br><br></td><td align='center'><br><br><br></td></tr>
    <tr><td align='center'>(...............)<br><br></td><td align='center'>(...............)<br><br></td></tr>
    </table>
    <p>Keterangan :</p>
    </body></html>`;   
    await page3.setContent(htmlContent3);
    const pdfBuffer3 = await page3.pdf({ 
        //format: 'A5', 
        margin: { top: 10, bottom: 0, right: 38, left: 0 },
        height: '297mm',
        width:'80mm',
        printBackground: true
    });
    await browser3.close();*/
    
    // Save the PDF to a file
    const pdfPath = path.join(process.cwd(), 'public/pdf/', 'notapemesanan_'+`${NoNota}`+'.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    var FilePDF = 'notapemesanan_'+`${NoNota}`+'.pdf';
    Data.FilePDF = FilePDF;
    console.log("Generate PDF Sukses!");

    /*const pdfPath2 = path.join(process.cwd(), 'public/pdf/', 'kartugaransi_'+`${NoNota}`+'.pdf');
    const pdfPath3 = path.join(process.cwd(), 'public/pdf/', 'suratorder_'+`${NoNota}`+'.pdf');      
    fs.writeFileSync(pdfPath2, pdfBuffer2);
    fs.writeFileSync(pdfPath3, pdfBuffer3);       
    var FilePDF2 = 'kartugaransi_'+`${NoNota}`+'.pdf';
    Data.FilePDF2 = FilePDF2;
    var FilePDF3 = 'suratorder_'+`${NoNota}`+'.pdf';
    Data.FilePDF3 = FilePDF3;*/
    
    
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
    return NextResponse.json({message: "Nota PDF Terkirim",Data},{status:201});    
}
