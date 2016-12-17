$("#cambioClave-btn").click(function() {
  
  $("#claveModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  $('#old_pass').val('');
  $('#newpass1').val('');
  $('#newpass2').val('');
  return false;
});

$("#masivo_inverso").click(function() {
  
  //$("#masivo_inverso").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});
Func.IntevaloLogin();


$("#CambiarClave").click(function() {
	var old_pass = $('#old_pass').val();
	var newpass1 = $('#newpass1').val();
    var newpass2 = $('#newpass2').val();
    
    if(old_pass==""){
    	alert("Ingrese la contraseña anterior!");
        $("#old_pass").focus();
        return false;
    }else if(newpass1== ""||newpass2== "") {
        alert("Ingrese la nueva contraseña!");
        $("#newpass1").focus();
        return false;
    }else if(newpass1!= newpass2) {
        alert("Las contraseñas no son iguales!");
        $("#newpass1").focus();
        return false;
    }else{
    	var login=Func.DataLogin();
        var data= {id:login.id,pass:old_pass,pasnew:newpass2};
		var DataAES =Func.Ecrypted(data);
		console.log(DataAES);
      	socket.emit('CambioPass',{aes:DataAES,idSkt:GeoCode.idSkt});
        socket.on('SetCambioUsuario',function(data){
        	var DataAES =Func.Decrypted(data);
      		console.log(DataAES);  
      		if(DataAES.cambio=="0"){
      			alert("Clave anterior errada!!");
      		}else if(DataAES.cambio=="ok"){
      			 $("#claveModal").modal("hide");
      			return true;	
      		}
            
        });
    }
	return false;
});

$("#cerrarSession-btn").click(function() {
 	Func.CerrarAPP();
});
