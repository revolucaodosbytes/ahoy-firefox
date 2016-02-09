window.addEventListener('click', function(event) {
    var target = event.target;
    
    if (target.id == 'forcarProxy' || target.id == 'listaSites')
    {
        self.port.emit('daNovoProxy', target.toString());
    }
    
    if (target.id == 'verSites')
    {
        self.port.emit('openTabSites', target.toString());
    }
}, false);

self.on('message', function(data){
    if(data.hasOwnProperty('proxy'))
    {
        document.getElementById("proxyaddr").innerHTML = data.proxy;
    }
    if(data.hasOwnProperty('version'))
    {
        document.getElementById("ahoy-version").innerHTML = data.version;
    }
})