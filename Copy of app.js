var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var Converter = require("csvtojson").Converter;
var moment = require('moment');
var pg = require('pg');
var http = require('http').Server(app);
var io = require('socket.io')(http);


http.listen(3000, function() {
    console.log('Server listening on port 3000');
});

var cxPG = { //console.log('Sincronizo'+moment().format('DD-MM-YYYY HH:mm'));
    user: 'postgres',
    password: 'postgres',
    database: 'geocoder',
    host: '127.0.0.1',
    port: 5433,
    application_name: 'Geocodificardor Cali',
    max: 10, //set pool max size to 20
    min: 2, //set min pool size to 4
    idleTimeoutMillis: 1000 //close idle clients after 1 second
};

var pool = new pg.Pool(cxPG);

var data = {
    tituloX: function(fila) {
        var tx = undefined;
        var titulos = Object.keys(fila);
        for (var i = 0; i < titulos.length; i++) { //console.log(titulos[i]);
            var t = titulos[i].toString().toUpperCase().trim();
            if (t == "X") {
                tx = titulos[i];
                break;
            }
            if (t == "CX") {
                tx = titulos[i];
                break;
            }
            if (t == "LON") {
                tx = titulos[i];
                break;
            }
            if (t == "LONG") {
                tx = titulos[i];
                break;
            }
            if (t == "LONGITUD") {
                tx = titulos[i];
                break;
            }
        }
        if (tx == undefined) { //console.log("Revisa valores");
            for (var i = 0; i < titulos.length; i++) {
                var t = fila[titulos[i]].toString().toUpperCase().trim();
                if (t == "X") {
                    tx = titulos[i];
                    break;
                }
                if (t == "CX") {
                    tx = titulos[i];
                    break;
                }
                if (t == "LON") {
                    tx = titulos[i];
                    break;
                }
                if (t == "LONG") {
                    tx = titulos[i];
                    break;
                }
                if (t == "LONGITUD") {
                    tx = titulos[i];
                    break;
                }
            }
        }
        return tx;
    },
    tituloY: function(fila) {
        var ty = undefined;
        var titulos = Object.keys(fila);
        for (var i = 0; i < titulos.length; i++) {
            var v = titulos[i].toString().toUpperCase().trim();
            if (v == "Y") {
                ty = titulos[i];
                break;
            }
            if (v == "CY") {
                ty = titulos[i];
                break;
            }
            if (v == "LAT") {
                ty = titulos[i];
                break;
            }
            if (v == "LATITUD") {
                ty = titulos[i];
                break;
            }
        }
        if (ty == undefined) {
            for (var i = 0; i < titulos.length; i++) {
                var v = fila[titulos[i]].toString().toUpperCase().trim();
                if (v == "Y") {
                    ty = titulos[i];
                    break;
                }
                if (v == "CY") {
                    ty = titulos[i];
                    break;
                }
                if (v == "LAT") {
                    ty = titulos[i];
                    break;
                }
                if (v == "LATITUD") {
                    ty = titulos[i];
                    break;
                }
            }
        }
        return ty;
    },
    leerArchivo: function(rutaArchivo, id_usr, srid) {
        console.log(rutaArchivo);
        var converter = new Converter({
            constructResult: true,
            delimiter: ';',
            ignoreEmpty: true,
            checkColumn: true,
            noheader: false
        });
        converter.fromFile(rutaArchivo, function(err, jsonArray) {
            var contador = 0; //console.log(jsonArray);
            if (jsonArray != undefined) {
                if (jsonArray.length > 0) {
                    var BreakException = {};
                    var headerX, headerY;
                    //ELIMINA GEOCODE ANTERIOR DEL USUARIO
                    pool.query("DELETE FROM  geocode_tmp_inv WHERE id_usr = $1;", [id_usr],
                        function(err, result) {
                            if (err) return console.error('Error Eliminando datos cordenada', err);
                        }
                    );
                    try {
                        jsonArray.forEach(function(fila) {
                            if (contador == 0) { //console.log(fila);
                                headerX = data.tituloX(fila); //console.log("ColumnaX: "+headerX);
                                headerY = data.tituloY(fila); //console.log("ColumnaY: "+headerY);
                            } else {
                                if (headerX == undefined || headerY == undefined) throw BreakException;
                            } //console.log(fila[headerX] + " " + fila[headerY]);
                            if (fila[headerX] != null && fila[headerY] != null) { //console.log("inserta");
                                pool.query("INSERT INTO geocode_tmp_inv(id_usr, x, y,srid) VALUES ($1, $2, $3, $4);", [id_usr, fila[headerX], fila[headerY], srid],
                                    function(err, result) {
                                        if (err) return console.error('Error insertando cordenada', err);
                                        contador++;
                                        /*if(jsonArray.length==contador){
											console.log("TERMINÓ DE INSERTAR");
											setTimeout(function(){ 
												//ELIMINA GEOCODE ANTERIOR DEL USUARIO
									            pool.query("WITH rows AS ("+
									            "update geocode_tmp_inv set ok=1,dir = geocali_reversev1(x, y) where id_usr = $1 RETURNING 1"+
													") SELECT count(*) c FROM rows;",[id_usr],
									                function(err, result) { 
									                	if (err) return console.error('Error Eliminando datos cordenada', err);
									                	console.log(result.rows[0].c);
									                	console.log("Actualizó: "+moment().format('h:mm:s:SSSS')); 
									                }
									            );	
				 							}, 200);
										}*/
                                    }); //console.log(fila);
                            }

                        });
                    } catch (e) {
                        console.log(e);
                        console.log("Archivo No Valido");
                        if (e !== BreakException) throw e;
                    }
                    console.log("Json Archivo: " + moment().format('h:mm:s:SSSS'));
                    console.log("------------------------------------------------");
                }
            } else {
                console.log("No se pudo leer el archivo");
            }
        });
    }
};


var geocode={
	InitData:function(){
		app.use(express.static(path.join(__dirname, 'public')));

		app.get('/', function(req, res) {
		    res.sendFile(path.join(__dirname, 'views/index.html'));
		});
		app.post('/upload/:id_usr/:srid', function(req, res) {
				var id_usr = req.params.id_usr;
			    console.log("Usuario: " + id_usr);
			    var srid = req.params.srid;
			    console.log("SRID: " + srid);
			
			    // create an incoming form object 
			    var form = new formidable.IncomingForm();
			    var rutaArchivo, nombreArchivo;
			
			    // specify that we want to allow the user to upload multiple files in a single request
			    form.multiples = true;
			
			    // store all uploads in the /uploads directory
			    form.uploadDir = path.join(__dirname, '/uploads');
			
			    // every time a file has been uploaded successfully,
			    // rename it to it's orignal name
			    form.on('file', function(field, file) {
			        fs.rename(file.path, path.join(form.uploadDir, file.name));
			        nombreArchivo = file.name;
			        rutaArchivo = path.join(form.uploadDir, nombreArchivo);
			    });
			
			    // log any errors that occur
			    form.on('error', function(err) {
			        console.log('An error has occured: \n' + err);
			    });
			
			    // once all the files have been uploaded, send a response to the client
			    form.on('end', function() {
			        res.end(nombreArchivo);
			        console.log(moment().format('h:mm:s:SSSS'));
			        setTimeout(function() {
			            data.leerArchivo(rutaArchivo, id_usr, srid);
			        }, 100);
			    });
			
			    // parse the incoming request containing the form data
			    form.parse(req); //console.log(form.parse(req));
			
		});

	},
	Init:function(){
		this.InitData();	
	}	
}

geocode.Init();

