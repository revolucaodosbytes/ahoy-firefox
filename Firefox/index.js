//Constants
const {Cc, Ci, Cu} = require("chrome");
const { pathFor } = require('sdk/system');
const { data } = require('sdk/self');
const path = require('sdk/fs/path');
const file = require('sdk/io/file');
const APIAdress = "http://46.101.64.62";

//Variables 
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
var { setTimeout } = require("sdk/timers");
var Request = require("sdk/request").Request;
var { ToggleButton } = require('sdk/ui/button/toggle');
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var prefsvc = require("sdk/preferences/service");
var proxyAddress = "";

var panel = panels.Panel({
    contentURL: data.url("views/popup.html"),
    contentScriptFile: data.url("views/popup.js"),
    onHide: handleHide
});

//Huuum, alguém me pediu um proxy...
panel.port.on("daNovoProxy", function(url) {
    console.log("vou buscar um proxy...");
    getProxy();
    console.log("toma...");
});

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

function setProxy(proxy)
{
    prefsvc.set("network.proxy.type", 2);

    prefsvc.set("network.proxy.autoconfig_url", getPac(proxy));
    
    panel.postMessage(proxy);
}

function getProxy()
{
    Request({
        url: APIAdress+"/api/getProxy",
        onComplete: function (response) {
            setProxy(response.json["host"]+":"+response.json["port"]);
        }
    }).get();
}

function getPac(proxy)
{
    return "https://ahoy-api.revolucaodosbytes.pt/api/pac?proxy_addr=" + proxy + "";
}

//execute this function every 30 minutes
//miliseconds * second * minutes
setTimeout(function() {
  getProxy();
}, (1000 * 60 * 30))

getProxy();