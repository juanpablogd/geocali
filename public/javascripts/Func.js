var Func={
	Decrypted : function (message) {
		if(text==''){
			this.CerrarAPP();
			return false;
		}else{
			var text='';
			try {
				var text=JSON.parse(CryptoJS.AES.decrypt(message,Config.cl).toString(CryptoJS.enc.Utf8));
			}
			catch(err) {
			    this.CerrarAPP();
				return false;
			}
			return text;
		}
		
	},
	Ecrypted: function (json){
		var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(json), Config.cl);
		return ciphertext.toString();
	}
	,
	DataLogin: function (){
		var DatosUsuario=this.Decrypted(sessionStorage.dt);
		return	DatosUsuario;
	},
	CerrarAPP: function(){
	   sessionStorage.clear();
	   window.location.assign("./");
	},
	ValidaUsuario: function(){
		if(!sessionStorage.dt){
			this.CerrarAPP();
	    }else{
	    	var data=this.DataLogin();
	    	//console.log(data);
	    	if(!data.perfil){
	        	this.CerrarAPP();	
	        }
	    }
	},
	IntevaloLogin:function(){
		var _this=this;
		_this.ValidaUsuario();
		setInterval(function(){
			//console.log('Valido');
			_this.ValidaUsuario();
		}, 1000*5);	
	}
};
