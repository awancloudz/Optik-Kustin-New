import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Pemesanan from "@/models/pemesanan";

import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from "node-thermal-printer";

export async function GET(){
    await connectMongoDB();
    const pemesanan = await Pemesanan.find();
    return NextResponse.json({pemesanan},{status:201});
}

export async function POST(request){
    //Capture Data from AppSheet
    const{Data} = await request.json();
    console.log("Nota Toko(localhost) Printed!");
  
    //Deteksi Cabang
    const Cabang = Data.STORE;

    //Data Utama
    const NoNota = Data.NOTA;
    const TanggalPesan = Data["TGL PESAN"];
    const TanggalSelesai = Data["TGL SELESAI"];
    const RX = Data.RX;
    const IDCustomer = Data["ID MEMBER"];
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
        
    //Printer Ke Printer Lokal
    const printLokal = async() => {        
        //const electron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;

        let printerSO = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            //interface: 'printer: POS80 Printer USB',
            interface: 'tcp://192.168.1.1',
            //driver: driverPrint,
            //lineCharacter: ".",
        });
        
        var data = `${NoNota}`;         // Barcode data (string or buffer)
        var type = 69                   // Barcode type (See Reference)
        var settings = {                // Optional Settings
        width: 5,                       // Barcode width
        height: 100,                    // Barcode height (0≤ height ≤255)
        }
        
        //await printerSO.printImage('./public/png/123456.png');
        printerSO.printBarcode(data, type, settings);
        printerSO.println();   
        printerSO.alignCenter();
        printerSO.setTextDoubleWidth();
        printerSO.println('OPTIK KUSTIN'); 
        printerSO.setTextNormal();
        printerSO.println(`Jl. Sirojudin Raya No.37`);
        printerSO.println(`Undip Tembalang - Kota Semarang`);
        printerSO.println(`Telp. 024-76402637 - WA 0813 7757 2015`);
        printerSO.drawLine();
        printerSO.tableCustom([                                      
            { text:"No", align:"LEFT", width:0.3 },
            { text:": "+`${NoNota}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Rx", align:"LEFT", width:0.3 },
            { text:": "+`${RX}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Tgl. Pembelian", align:"LEFT", width:0.3 },
            { text:": "+`${TanggalPesan}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Tgl. Selesai", align:"LEFT", width:0.3 },
            { text:": "+`${TanggalSelesai}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.drawLine();
        printerSO.tableCustom([                                      
            { text:"Nama", align:"LEFT", width:0.3 },
            { text:": "+`${NamaCustomer}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Alamat", align:"LEFT", width:0.3 },
            { text:": "+`${Alamat}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Telp", align:"LEFT", width:0.3 },
            { text:": "+`${NoHandphone}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Umur", align:"LEFT", width:0.3 },
            { text:": "+`${Umur}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Jenis Kelamin", align:"LEFT", width:0.3 },
            { text:": "+`${JenisKelamin}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.drawLine();
        printerSO.tableCustom([          
            { text:"", align:"CENTER"},                            
            { text:"SPH", align:"CENTER", bold:true},
            { text:"CYL", align:"CENTER", bold:true},
            { text:"AXIS", align:"CENTER", bold:true},
            { text:"ADD", align:"CENTER", bold:true},
            { text:"PD", align:"CENTER", bold:true},
            { text:"VisAkhir", align:"CENTER", bold:true, width:0.2},
        ]);
        printerSO.drawLine();
        printerSO.tableCustom([                                      
            { text:"R", align:"CENTER"},
            { text:`${Data["SPH RIGHT"]}`, align:"CENTER"},
            { text:`${Data["CYL RIGHT"]}`, align:"CENTER"},
            { text:`${Data["AXIS RIGHT"]}`, align:"CENTER"},
            { text:`${Data["ADD"]}`, align:"CENTER"},
            { text:`${Data["PD"]}`, align:"CENTER"},
            { text: "6/6", align:"CENTER", width:0.2},
        ]);
        printerSO.tableCustom([                                      
            { text:"L", align:"CENTER"},
            { text:`${Data["SPH LEFT"]}`, align:"CENTER"},
            { text:`${Data["CYL LEFT"]}`, align:"CENTER"},
            { text:`${Data["AXIS LEFT"]}`, align:"CENTER"},
            { text: " ", align:"CENTER"},
            { text: " ", align:"CENTER"},
            { text: "6/6", align:"CENTER", width:0.2},
        ]);
        printerSO.drawLine();
        printerSO.tableCustom([                                      
            { text:"Jenis Frame", align:"LEFT", width:0.25 },
            { text:": "+`${Data["JENIS FRAME"]}`, align:"LEFT", width:0.25 },
            { text:" Wrap Angle", align:"LEFT", width:0.25 },
            { text:": "+`${Data["WRAP ANGLE"]}`, align:"LEFT", width:0.25 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Koridor", align:"LEFT", width:0.25 },
            { text:": "+`${Data["CORRIDOR"]}`, align:"LEFT", width:0.25 },
            { text:" PantoscopiK", align:"LEFT", width:0.25 },
            { text:": "+`${Data["PANTOSCOPIK"]}`, align:"LEFT", width:0.25 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Vis.Balance", align:"LEFT", width:0.25 },
            { text:": "+`${Data["VISUS BALANCING"]}`, align:"LEFT", width:0.25 },
            { text:" Vertex Dist", align:"LEFT", width:0.25 },
            { text:": "+`${Data["VERTEX DISTANCE"]}`, align:"LEFT", width:0.25 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Duke Elder", align:"LEFT", width:0.25 },
            { text:": "+`${Data["DUKE ELDER"]}`, align:"LEFT", width:0.25 },
            { text:" Cat. Resep", align:"LEFT", width:0.25 },
            { text:": "+`${Data["CATATAN RESEP"]}`, align:"LEFT", width:0.25 }
        ]);
        printerSO.drawLine();
        printerSO.println(); 
        printerSO.alignLeft();
        printerSO.println('PRECAL :'); 
        printerSO.drawLine();
        printerSO.tableCustom([          
            { text:"A", align:"CENTER"},                            
            { text:"B", align:"CENTER"},
            { text:"DBL", align:"CENTER"},
            { text:"MPD", align:"CENTER"},
            { text:"SH/PV", align:"CENTER", width:0.4}
        ]);
        printerSO.drawLine();
        printerSO.tableCustom([          
            { text:`${Data["A"]}`, align:"CENTER"},                            
            { text:`${Data["B"]}`, align:"CENTER"},
            { text:`${Data["DBL"]}`, align:"CENTER"},
            { text:`${Data["MPD"]}`, align:"CENTER"},
            { text:`${Data["SH/PV"]}`, align:"CENTER", width:0.4}
        ]);
        printerSO.println(); 
        printerSO.tableCustom([                                      
            { text:"Frame", align:"LEFT", width:0.3 },
            { text:": "+`${Data.FRAME}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Lensa", align:"LEFT", width:0.3 },
            { text:": "+`${Data.LENSA}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Total", align:"LEFT", width:0.3 },
            { text:": "+`${Data.TOTAL}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Uang Muka", align:"LEFT", width:0.3 },
            { text:": "+`${Data.UANGMUKA}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.tableCustom([                                      
            { text:"Sisa", align:"LEFT", width:0.3 },
            { text:": "+`${Data.LENSA}`, align:"LEFT", width:0.6 }
        ]);
        printerSO.println(); 
        printerSO.println(); 
        printerSO.setTextDoubleWidth();
        printerSO.alignCenter();
        printerSO.println(`${Cabang}`); 
        printerSO.setTextNormal();
        printerSO.println(); 
        printerSO.tableCustom([                                      
            { text:"Edger", align:"CENTER", width:0.45 },
            { text:"Quality Control", align:"CENTER", width:0.45 }
        ]);
        printerSO.println();
        printerSO.println();
        printerSO.println();
        printerSO.tableCustom([  
            { text:"(...............)", align:"CENTER", width:0.45 },
            { text:"(...............)", align:"CENTER", width:0.45 },
        ]);
        printerSO.println();
        printerSO.println();
        printerSO.tableCustom([                                      
            { text:"Yang Menyerahkan", align:"CENTER", width:0.45 },
            { text:"Penerima", align:"CENTER", width:0.45 }
        ]);
        printerSO.println();
        printerSO.println();
        printerSO.println();
        printerSO.tableCustom([  
            { text:"(...............)", align:"CENTER", width:0.45 },
            { text:"(...............)", align:"CENTER", width:0.45 },
        ]);
        printerSO.cut();

        try {
            printerSO.execute()
            console.log("Print done!");
        } catch (error) {
            console.error("Print failed:", error);
        }
    }
    await printLokal();

    //Response
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}