var blockedHosts = [];
var proxyAddress = "";

// tell the background script that we are ready
browser.runtime.sendMessage("init");

// listen for updates to the blocked host list
browser.runtime.onMessage.addListener((message) => {
    blockedHosts = message.hosts;
    proxyAddress = `PROXY ${message.proxy}`;
});

// required PAC function that will be called to determine
// if a proxy should be used.
function FindProxyForURL(url, host) {
    var hostname = host.replace("www.","").replace(/(http(s?))\:\/\//g,"").replace("/","");
    
    if (blockedHosts.indexOf(hostname) != -1) {
        browser.runtime.sendMessage(`Proxy-blocker: blocked ${hostname}`);
        return proxyAddress;
    }

    return "DIRECT";
}