window.addEventListener('click', function(event) {
    var target = event.target;
    
    if (target.id == 'forcarProxy' || target.id == 'listaSites') {
        self.port.emit('daNovoProxy', target.toString());
    }
    
    if (target.id == 'verSites') {
        self.port.emit('openTabSites', target.toString());
    }
    
    if (target.id == 'mensagem') {
        self.port.emit('openTabLink', target.toString());
    }
}, false);

self.on('message', function(data){
    if(data.hasOwnProperty('host') && data.hasOwnProperty('port')) {
       document.getElementById("proxyaddr").textContent = data.host + ':' + data.port;
    }
    
    if(data.hasOwnProperty('version')) {
        document.getElementById("ahoy-version").textContent = data.version;
    }
})

self.port.on('currentURL', function( currentURL, blockedSites ) {  
    var cleanURL = currentURL.replace(/.*?:\/\/www.|.*?:\/\//g,"").replace(/\//g,"");

    if ( blockedSites.indexOf(cleanURL) != -1 ) {
       document.getElementById('status-inactivo').style.display = "none";
       document.getElementById('status-activo').style.display = "";
    } else {
       document.getElementById('status-inactivo').style.display = "";
       document.getElementById('status-activo').style.display = "none";    
   }
});