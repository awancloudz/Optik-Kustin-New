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
    const printLokal = () => {        
        // const electron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;

        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: 'tcp://192.168.1.1:9100',
            //interface: 'printer:EPSON TM-T82 Receipt',
            // driver: require(electron ? 'electron-printer' : 'printer') 
        });

        var data = `${NoNota}`;        // Barcode data (string or buffer)
        var type = 4             // Barcode type (See Reference)
        var settings = {         // Optional Settings
        characters: 1,         // Add characters (See Reference)
        mode: 3,               // Barcode mode (See Reference)
        height: 150,           // Barcode height (0≤ height ≤255)
        }
        
        printer.printBarcode(data, type, settings);
        printer.println();     
        printer.alignCenter();
        printer.println('OPTIK KUSTIN'); 
        printer.println(`Jl. Sirojudin Raya No.37`);
        printer.println(`Undip Tembalang - Kota Semarang`);
        printer.println(`Telp. 024-76402637 - WA 0813 7757 2015`);
        printer.drawLine();
        printer.setTextNormal();
        printer.tableCustom([                                      
            { text:"No", align:"LEFT", width:0.3 },
            { text:": "+`${NoNota}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Rx", align:"LEFT", width:0.3 },
            { text:": "+`${RX}`, align:"LEFT"}
        ]);
        printer.tableCustom([                                      
            { text:"Tgl. Pembelian", align:"LEFT", width:0.3 },
            { text:": "+`${TanggalPesan}`, align:"LEFT"}
        ]);
        printer.tableCustom([                                      
            { text:"Tgl. Selesai", align:"LEFT", width:0.3 },
            { text:": "+`${TanggalSelesai}`, align:"LEFT", width:0.7 }
        ]);
        printer.drawLine();
        printer.tableCustom([                                      
            { text:"Nama", align:"LEFT", width:0.3 },
            { text:": "+`${NamaCustomer}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Alamat", align:"LEFT", width:0.3 },
            { text:": "+`${Alamat}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Telp", align:"LEFT", width:0.3 },
            { text:": "+`${NoHandphone}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Umur", align:"LEFT", width:0.3 },
            { text:": "+`${Umur}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Jenis Kelamin", align:"LEFT", width:0.3 },
            { text:": "+`${JenisKelamin}`, align:"LEFT", width:0.7 }
        ]);
        printer.drawLine();
        printer.tableCustom([          
            { text:" ", align:"CENTER"},                            
            { text:"SPH", align:"CENTER"},
            { text:"CYL", align:"CENTER"},
            { text:"AXIS", align:"CENTER"},
            { text:"ADD", align:"CENTER"},
            { text:"PD", align:"CENTER"},
            { text:"Vis Akhir", align:"CENTER", width:0.25},
        ]);
        printer.drawLine();
        printer.tableCustom([                                      
            { text:"R", align:"CENTER"},
            { text:`${Data["SPH RIGHT"]}`, align:"CENTER"},
            { text:`${Data["CYL RIGHT"]}`, align:"CENTER"},
            { text:`${Data["AXIS RIGHT"]}`, align:"CENTER"},
            { text:`${Data["ADD"]}`, align:"CENTER"},
            { text:`${Data["PD"]}`, align:"CENTER"},
            { text: "6/6", align:"CENTER", width:0.25},
        ]);
        printer.tableCustom([                                      
            { text:"L", align:"CENTER"},
            { text:`${Data["SPH LEFT"]}`, align:"CENTER"},
            { text:`${Data["CYL LEFT"]}`, align:"CENTER"},
            { text:`${Data["AXIS LEFT"]}`, align:"CENTER"},
            { text: " ", align:"CENTER"},
            { text: " ", align:"CENTER"},
            { text: " 6/6", align:"CENTER", width:0.25},
        ]);
        printer.drawLine();
        printer.tableCustom([                                      
            { text:"Jenis Frame", align:"LEFT", width:0.25 },
            { text:": "+`${Data["JENIS FRAME"]}`, align:"LEFT", width:0.25 },
            { text:" Wrap Angle", align:"LEFT", width:0.25 },
            { text:": "+`${Data["WRAP ANGLE"]}`, align:"LEFT", width:0.25 }
        ]);
        printer.tableCustom([                                      
            { text:"Koridor", align:"LEFT", width:0.25 },
            { text:": "+`${Data["CORRIDOR"]}`, align:"LEFT", width:0.25 },
            { text:" PantoscopiK", align:"LEFT", width:0.25 },
            { text:": "+`${Data["PANTOSCOPIK"]}`, align:"LEFT", width:0.25 }
        ]);
        printer.tableCustom([                                      
            { text:"Vis.Balancing", align:"LEFT", width:0.25 },
            { text:": "+`${Data["VISUS BALANCING"]}`, align:"LEFT", width:0.25 },
            { text:" Vertex Dist", align:"LEFT", width:0.25 },
            { text:": "+`${Data["VERTEX DISTANCE"]}`, align:"LEFT", width:0.25 }
        ]);
        printer.tableCustom([                                      
            { text:"Duke Elder", align:"LEFT", width:0.25 },
            { text:": "+`${Data["DUKE ELDER"]}`, align:"LEFT", width:0.25 },
            { text:" Cat. Resep", align:"LEFT", width:0.25 },
            { text:": "+`${Data["CATATAN RESEP"]}`, align:"LEFT", width:0.25 }
        ]);
        printer.drawLine();
        printer.println(); 
        printer.println('PRECAL :'); 
        printer.drawLine();
        printer.tableCustom([          
            { text:"A", align:"CENTER"},                            
            { text:"B", align:"CENTER"},
            { text:"DBL", align:"CENTER"},
            { text:"MPD", align:"CENTER"},
            { text:"SH/PV", align:"CENTER"}
        ]);
        printer.drawLine();
        printer.tableCustom([          
            { text:`${Data["A"]}`, align:"CENTER"},                            
            { text:`${Data["B"]}`, align:"CENTER"},
            { text:`${Data["DBL"]}`, align:"CENTER"},
            { text:`${Data["MPD"]}`, align:"CENTER"},
            { text:`${Data["SH/PV"]}`, align:"CENTER"}
        ]);
        printer.println(); 
        printer.tableCustom([                                      
            { text:"Frame", align:"LEFT", width:0.3 },
            { text:": "+`${Data.FRAME}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Lensa", align:"LEFT", width:0.3 },
            { text:": "+`${Data.LENSA}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Total", align:"LEFT", width:0.3 },
            { text:": "+`${Data.TOTAL}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Uang Muka", align:"LEFT", width:0.3 },
            { text:": "+`${Data.UANGMUKA}`, align:"LEFT", width:0.7 }
        ]);
        printer.tableCustom([                                      
            { text:"Sisa", align:"LEFT", width:0.3 },
            { text:": "+`${Data.LENSA}`, align:"LEFT", width:0.7 }
        ]);
        printer.println(); 
        printer.bold(true); 
        printer.println(`${Cabang}`); 
        printer.println(); 
        printer.tableCustom([                                      
            { text:"Edger", align:"CENTER", width:0.5 },
            { text:"Quality Control", align:"CENTER", width:0.5 }
        ]);
        printer.println();
        printer.println();
        printer.println();
        printer.tableCustom([  
            { text:"(...............)", align:"CENTER", width:0.5 },
            { text:"(...............)", align:"CENTER", width:0.5 },
        ]);
        printer.println();
        printer.println();
        printer.tableCustom([                                      
            { text:"Yang Menyerahkan", align:"CENTER", width:0.5 },
            { text:"Penerima", align:"CENTER", width:0.5 }
        ]);
        printer.println();
        printer.println();
        printer.println();
        printer.tableCustom([  
            { text:"(...............)", align:"CENTER", width:0.5 },
            { text:"(...............)", align:"CENTER", width:0.5 },
        ]);
        //printer.cut();

        try {
            printer.execute()
            console.log("Print done!");
        } catch (error) {
            console.error("Print failed:", error);
        }
    }
    printLokal();

    //Response
    return NextResponse.json({message: "Nota Terkirim",Data},{status:201});    
}