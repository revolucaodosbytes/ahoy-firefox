window.addEventListener('click', function(event) {
    var target = event.target;
    console.log(target.id);
    if (target.id == 'forcarProxy')
    {
        self.port.emit('daNovoProxy', target.toString());
    }
}, false);

self.on('message', function(data){
    document.getElementById("proxyaddr").innerHTML= data;
})