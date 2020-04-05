// Initialize the ahoy
var ahoy = new Ahoy();

// Location of the proxy script, relative to manifest.json
const proxyScriptURL = "proxy-handler.js";

/**
 * auxiliar functions
 */
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

function parseVersionString (str) {
  if (typeof(str) != "string") { return false; }
  var x = str.split(".");
  // parse from string or default to 0 if can't parse
  var maj = parseInt(x[0]) || 0;
  var min = parseInt(x[1]) || 0;
  var pat = parseInt(x[2]) || 0;

  return {
      major: maj,
      minor: min,
      patch: pat
  }
}

/**
 * Alarms - Periodic Tasks
 * Updating the Local Storage with the latest info
 */

// Create the periodic alarm to fetch new sites
browser.alarms.create( "update_sites_and_proxy", { delayInMinutes: 30, periodInMinutes: 30 } );

// Handle the alarms

browser.alarms.onAlarm.addListener( function (alarm) {
	if (alarm.name == "update_sites_and_proxy") {
		ahoy.update_site_list();
		ahoy.update_proxy();
	}
});

function getPopup() {
    return browser.extension.getViews( { type: "popup" } );
}

// Default settings. If there is nothing in storage, use these values.
const defaultSettings = {
  sites_list: ["thepiratebay.org"],
  proxy_addr: "proxy1.ahoy.pro:3127"
}

// Register the proxy script
browser.proxy.register(proxyScriptURL);

// Log any errors from the proxy script
browser.proxy.onProxyError.addListener(error => {
  console.error(`Proxy error: ${error.message}`);
});

// Initialize the proxy
function handleInit() {
  // update the proxy whenever stored settings change
  browser.storage.onChanged.addListener((newSettings) => {
    browser.runtime.sendMessage(newSettings.sites_list.newValue, newSettings.proxy_addr.newValue, {toProxyScript: true});
  });

  // get the current settings, then...
  browser.storage.local.get()
    .then((storedSettings) => {
      // if there are stored settings, update the proxy with them...
      if (storedSettings.sites_list && storedSettings.proxy_addr) {
        browser.runtime.sendMessage({hosts: storedSettings.sites_list, proxy: storedSettings.proxy_addr}, {toProxyScript: true});
      // ...otherwise, initialize storage with the default values
      } else {
        browser.storage.local.set(defaultSettings);
      }

    })
    .catch(()=> {
      console.log("Error retrieving stored settings");
    });
}

function handleMessage(message, sender) {
  // only handle messages from the proxy script
  if (sender.url != browser.extension.getURL(proxyScriptURL)) {
    return;
  }

  if (message === "init") {
    handleInit(message);
  } else {
    // after the init message the only other messages are status messages
    console.log(message);
  }
}

browser.runtime.onMessage.addListener(handleMessage);