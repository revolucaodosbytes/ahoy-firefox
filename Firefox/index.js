//Constants
const {Cc, Ci, Cu} = require("chrome");
const { data } = require('sdk/self');
const APIAdress = "http://ahoy-api.revolucaodosbytes.pt";

//Variables 
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
var pps = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
var { setTimeout } = require("sdk/timers");
var Request = require("sdk/request").Request;
var { ToggleButton } = require('sdk/ui/button/toggle');
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var version = require("sdk/self").version;
var proxyAddress = "";
var auxJSON = {};
var blockedSites = {}; 

var panel = panels.Panel({
    width: 310,
    height: 375,
    contentURL: data.url("views/popup.html"),
    contentScriptFile: data.url("views/popup.js"),
    onHide: handleHide
});

panel.port.on("daNovoProxy", function(url) {
    getProxy();
    getBlockedSitesList();
    tabs.activeTab.reload()
    panel.hide()
});

panel.port.on("openTabSites", function(url) {
    openTabWithBlockedLinks();
    panel.hide()
});

panel.port.on("openTabLink", function(url) {
    openTabWithLink(auxJSON.messageURL);
    panel.hide()
});

panel.on('show', function() {
    panel.port.emit('currentURL', tabs.activeTab.url, blockedSites);
}.bind(blockedSites));

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

function escape_regex(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

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

function getProxy()
{
    Request({
        url: APIAdress+"/api/getProxy",
        onComplete: function (response) {
            auxJSON.host = response.json["host"];
            auxJSON.port = response.json["port"];
        }
    }).get();
}

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

function openTabWithLink(url)
{
    tabs.open({
        url: url,
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
            blockedSites = []; 
            for (var item in response.json) { 
                blockedSites.push( response.json[item] ); 
            };
        }.bind(blockedSites)
    }).get();
}

function logURL(tab)
{
    //check if the website we're trying to visit already exists on the blocked website list
    //we ONLY send statistics to our servers if the website that's beeing visited is on the list of blocked sites
    var cleanURL = tab.url.replace(/.*?:\/\/www.|.*?:\/\//g,"").replace(/\//g,"");
    
    if (cleanURL in blockedSites)
    {
        Request({
            url: APIAdress+"/api/stats/host/"+cleanURL
        }).get();
    }
}

function setAhoyFilter()
{
    // Create the proxy info object in advance to avoid creating one every time
    var ahoyProxy = pps.newProxyInfo("http", auxJSON.host, auxJSON.port, 0, -1, null);

    var filter = {
        applyFilter: function(pps, uri, proxy)
        {
            should_proxy = blockedSites.some( function(blocked_site) {
                var regex = new RegExp("^http(s)?:\/\/(www\.)?" + blocked_site );
                return regex.test(uri.spec);
            });

            if ( should_proxy )
                return ahoyProxy;

            return proxy;
        }
    };
    pps.registerFilter(filter, 1000);

    panel.postMessage(auxJSON);
}

function setIcon()
{
    panel.port.emit('greyIcon', tabs.activeTab.url);
}

//execute this function every 30 minutes
//miliseconds * second * minutes
setTimeout(function() { updateAhoy(); }, (1000 * 60 * 30));

function updateAhoy() {
    getBlockedSitesList();

    setTimeout(function() { updateAhoy(); }, (1000 * 60 * 30));
}

(function waitForProxy() {
    if ( auxJSON.host && auxJSON.port ) {
        setAhoyFilter();
    } else {
        setTimeout( waitForProxy, 500 );
    }
})();

(function waitForMessage() {
    if ( auxJSON.messageText && auxJSON.messageURL ) {
        panel.postMessage(auxJSON);
    } else {
        setTimeout( waitForMessage, 500 );
    }
})();

auxJSON.version = version;

getBlockedSitesList();

getProxy();


tabs.on("ready", logURL);
tabs.on("ready", setIcon);

panel.postMessage(auxJSON);
