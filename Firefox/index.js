//Constants
const {Cc, Ci, Cu} = require("chrome");
const { pathFor } = require('sdk/system');
const { data } = require('sdk/self');
const path = require('sdk/fs/path');
const file = require('sdk/io/file');
const APIAdress = "http://46.101.64.62";

//Variables 
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
var pps = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
var { setTimeout } = require("sdk/timers");
var Request = require("sdk/request").Request;
var { ToggleButton } = require('sdk/ui/button/toggle');
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var prefsvc = require("sdk/preferences/service");
var version = require("sdk/self").version;
var proxyAddress = "";
var auxJSON = {};
var blockedSites = [];

var panel = panels.Panel({
    width: 305,
    height: 327,
    contentURL: data.url("views/popup.html"),
    contentScriptFile: data.url("views/popup.js"),
    onHide: handleHide
});

//Huuum, alguém me pediu um proxy...
panel.port.on("daNovoProxy", function(url) {
    console.log("vou buscar um proxy...");

    getProxy();
    getBlockedSitesList();

    console.log("toma...");
});

//Bring me the list!
panel.port.on("openTabSites", function(url) {
    console.log("Yes master");
    openTabWithBlockedLinks();
    console.log("Here");
});

panel.on('show', function() {

    console.log(tabs.activeTab.url)
    panel.port.emit('currentURL', tabs.activeTab.url, blockedSites);

})

var button = ToggleButton({
    id: "ahoy-status",
    label: "Ahoy!",
    icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./ion-64.png"
    },
    onChange: handleChange
});

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

function handleHide() {
    button.state('window', {checked: false});
}

/*function setProxy(proxy)
{
    prefsvc.set("network.proxy.type", 2);
    console.log("Using PAC " + getPac(proxy) );
    prefsvc.set("network.proxy.autoconfig_url", getPac(proxy));

    auxJSON.proxy = proxy

    panel.postMessage(auxJSON);
}

function getProxy()
{
    Request({
        url: APIAdress+"/api/getProxy",
        onComplete: function (response) {
            console.log("Got a proxy: " + response.json["host"]);
            setProxy(response.json["host"]+":"+response.json["port"]);
        }
    }).get();
}

function getPac(proxy)
{
    return APIAdress + "/api/pac?proxy_addr=" + proxy + "&ignore_cache=" + Date.now();
}*/

function openTabWithBlockedLinks()
{
    tabs.open({
        url: "https://sitesbloqueados.pt/?utm_source=ahoy&utm_medium=firefox&utm_campaign=Ahoy%20Firefox",
        inBackground: true,
        onOpen: function(tab) {
            tab.activate();
            panel.hide();
        }
    });
}

function getBlockedSitesList()
{
    Request({
        url: APIAdress+"/api/sites",
        onComplete: function (response) {
            for (var item in response.json) {
                blockedSites.push(item);
            }
            console.log("feito");
        }.bind(blockedSites)
    }).get();
}

function logURL(tab)
{
    //check if the website we're trying to visit already exists on the blocked website list
    //we ONLY send statistics to our servers if the website that's beeing visited is on the list of blocked sites
    var cleanURL = tab.url.replace(/.*?:\/\/www.|.*?:\/\//g,"").replace(/\//g,"");
    if (blockedSites.indexOf(cleanURL) > -1)
    {
        Request({
            url: APIAdress+"/api/stats/host/"+cleanURL,
            onComplete: function (response) {
                console.log("Stats sent :)");
            }
        }).get();
    }
}

//execute this function every 30 minutes
//miliseconds * second * minutes
setTimeout(function() { updateAhoy(); }, (1000 * 60 * 30));

function updateAhoy() {
    getBlockedSitesList();

    setTimeout(function() { updateAhoy(); }, (1000 * 60 * 30));
}

auxJSON.version = version;

panel.postMessage(auxJSON);

//getProxy();

getBlockedSitesList();

tabs.on("ready", logURL);

// Create the proxy info object in advance to avoid creating one every time
var ahoyProxy = pps.newProxyInfo("http", "PROXY1.AHOY.PRO", 3128, 0, -1, null);

var filter = {
    applyFilter: function(pps, uri, proxy)
    {
        if (blockedSites.indexOf(uri.spec.replace(/.*?:\/\/www.|.*?:\/\//g,"").replace(/\/.+/g,"").replace(/\//g,"")) > -1)
        {
            return ahoyProxy;
        }
        else
        {
            return proxy;
        }
    }
};
pps.registerFilter(filter, 1000);

