var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var Converter = require("csvtojson").Converter;
var moment = require('moment');
var CryptoJS = require("crypto-js");
var pg = require('pg');
var http = require('http').Server(app);
var io = require('socket.io')(http);


http.listen(3000, function() {
    console.log('Server listening on port 3000');
});

var Config={
	cxPG : { //console.log('Sincronizo'+moment().format('DD-MM-YYYY HH:mm'));
		user: 'postgres',
		password: 'p0s76r3s',
		database: 'geocoder',
		host: '127.0.0.1',
		port: 5432,
		application_name: 'Geocodificardor Cali',
		max: 10, //set pool max size to 20
		min: 2, //set min pool size to 4
		idleTimeoutMillis: 1000 //close idle clients after 1 second
	},
	claveAES:'1erf2a5f1e87g1'	
};


var Func={
	Decrypted:function (message) {
		var decrypted =JSON.parse(CryptoJS.AES.decrypt(message,Config.claveAES).toString(CryptoJS.enc.Utf8));
		return decrypted; 
	},
	Ecrypted:function (json){
		var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(json), Config.claveAES);
		return ciphertext.toString();
	}
};


var pool = new pg.Pool(Config.cxPG);

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
    leerArchivo: function(rutaArchivo, id_usr, srid,idSkt) {
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
                    //ELIMINA GeoCode ANTERIOR DEL USUARIO
                    pool.query("DELETE FROM  t_geocode_tmp_inv WHERE id_usr = $1;", [id_usr],
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
                                pool.query("INSERT INTO t_geocode_tmp_inv(id_usr, x, y,srid) VALUES ($1, $2, $3, $4);", [id_usr, fila[headerX].replace(",", "."), fila[headerY].replace(",", "."), srid],
                                    function(err, result) {
                                        if (err) return console.error('Error insertando cordenada', err);
                                        contador++;   
                                        if(contador==jsonArray.length){
                                        	
                                        }                                    
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
var acceso={
	login:function(data){
		var dt=Func.Decrypted(data.aes);
		console.log(dt);
		var sql=' select id,nombre,perfil from public.t_usuario '+
			" where upper(usuario)=upper('"+dt.usr+"') and clave='"+dt.pas+"' and activo=1;";
		console.log(sql);	
		pool.query(sql,
            function(err, result) {
                if (err) {
                    return console.error('error running query', err);
                }               
                console.log(result.rows[0]);
                if(result.rows[0]){
		            var json=Func.Ecrypted(result.rows[0]);
		            
		            io.to(data.idSkt).emit('SetLoginUsuario', json);
                }else{
                	io.to(data.idSkt).emit('SetLoginUsuario', '');
                }
        });
	},
	CambioClave:function(data){
		var dt=Func.Decrypted(data.aes);
		console.log(dt);
		var sql='select id '+
		'from public.t_usuario '+
		"where id="+dt.id+" and clave='"+dt.pass+"' and activo=1 ";
		console.log(sql);	
		pool.query(sql,
         function(err, result) {
                if (err) {
                    return console.error('error running query', err);
                }               
                if(result.rows[0]){
                	var sql='update public.t_usuario '+
					" set clave='"+dt.pasnew+"' "+
					' where  id='+dt.id;
					console.log(sql);
					pool.query(sql,function(err, result) {
				    		var json=Func.Ecrypted({cambio:'ok'});    
		            		io.to(data.idSkt).emit('SetCambioUsuario', json);    	
				     });				    
                }else{
                	var json=Func.Ecrypted({cambio:'0'});
                	io.to(data.idSkt).emit('SetCambioUsuario', json);
                }
        });
	}
};
var GeoCode={
	InitData:function(){
		app.use(express.static(path.join(__dirname, 'public')));

		app.get('/', function(req, res) {
		    res.sendFile(path.join(__dirname, 'views/index.html'));
		});
		app.get('/geo', function(req, res) {
		    res.sendFile(path.join(__dirname, 'views/geo.html'));
		});
		app.post('/upload/:id_usr/:srid/:idSkt', function(req, res) {
				var id_usr = req.params.id_usr;
			    console.log("Usuario: " + id_usr);
			    var srid = req.params.srid;
			    console.log("SRID: " + srid);
			    var idSkt = req.params.idSkt;
			    console.log("SRID: " + idSkt);
			
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
			            data.leerArchivo(rutaArchivo, id_usr, srid,idSkt);
			        }, 100);
			    });
			
			    // parse the incoming request containing the form data
			    form.parse(req); //console.log(form.parse(req));
			
		});

	},
	socket:[],
	InitSocket:function (){
		var _this=this;
		io.on('connection', function (sckt) {
		  console.log('conecta id');
		  console.log(sckt.id);
		  sckt.on('usuario', function (usr, fn) {
		    console.log(sckt.id);
		    fn(sckt.id);
		  });
		  sckt.on('LoginUsuario', function (data) {
		  	 console.log('LoginUsuario');
		     acceso.login(data);
		   });
		   
		   sckt.on('CambioPass', function (data) {
		  	 console.log('CambioPass');
		  	 console.log(data);
		     acceso.CambioClave(data);
		   });
		   
		   
		});
	},
	Init:function(){
		this.InitData();
		this.InitSocket();	
	}	
};

GeoCode.Init();

