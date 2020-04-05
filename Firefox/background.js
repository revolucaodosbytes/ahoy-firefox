// Initialize the ahoy
const ahoy = new Ahoy();
let blockedHosts = [];
let proxyAddress = '';

/**
 * auxiliar functions
 */
const sleep = (milliseconds) => {
	const start = new Date().getTime();
	for (let i = 0; i < 1e7; i++) {
		if (new Date().getTime() - start > milliseconds) {
			break;
		}
	}
};

const parseVersionString = (str) => {
	if (typeof str != 'string') {
		return false;
	}
	const x = str.split('.');
	// parse from string or default to 0 if can't parse
	const maj = parseInt(x[0]) || 0;
	const min = parseInt(x[1]) || 0;
	const pat = parseInt(x[2]) || 0;

	return {
		major: maj,
		minor: min,
		patch: pat,
	};
};

/**
 * Alarms - Periodic Tasks
 * Updating the Local Storage with the latest info
 */

// Create the periodic alarm to fetch new sites
browser.alarms.create('update_sites_and_proxy', {
	delayInMinutes: 30,
	periodInMinutes: 30,
});

// Handle the alarms
browser.alarms.onAlarm.addListener(function (alarm) {
	if (alarm.name == 'update_sites_and_proxy') {
		ahoy.update_site_list();
		ahoy.update_proxy();
	}
});

function getPopup() {
	return browser.extension.getViews({ type: 'popup' });
}

// Default settings. If there is nothing in storage, use these values.
const defaultSettings = {
	sites_list: ['thepiratebay.org'],
	proxy_addr: 'proxy1.ahoy.pro:3127',
};

// Default list
browser.runtime.onInstalled.addListener((details) => {
	blockedHosts = blockedHosts;
	browser.storage.local.set({
		blockedHosts: blockedHosts,
	});
});

browser.storage.local.get((data) => {
	if (data.sites_list) {
		blockedHosts = data.sites_list;
	}
	if (data.proxy_addr) {
		proxyAddress = data.proxy_addr;
	}
});

browser.runtime.onMessage.addListener((message) => {
	browser.storage.local.set({
		blockedHosts: message.hosts,
		proxyAddress: `PROXY ${message.proxy}`,
	});

	blockedHosts = message.hosts;
	proxyAddress = `PROXY ${message.proxy}`;
});

browser.storage.onChanged.addListener((changeData) => {
	if (changeData.sites_list !== undefined) {
		blockedHosts = changeData.sites_list.newValue;
	}

	if (changeData.proxy_addr !== undefined) {
		proxy_addr = changeData.proxy_addr.newValue;
	}
});

// Managed the proxy
browser.proxy.onRequest.addListener(handleProxyRequest, {
	urls: ['<all_urls>'],
});

// On the request to open a webpage
function handleProxyRequest(requestInfo) {
	const url = new URL(requestInfo.url);
	const hostname = url.hostname
		.replace('www.', '')
		.replace(/(http(s?))\:\/\//g, '')
		.replace('/', '');

	if (blockedHosts.indexOf(hostname) != -1) {
		const proxyHost = proxyAddress.split(':')[0];
		const proxyPort = proxyAddress.split(':')[1];
		return { type: 'http', host: proxyHost, port: proxyPort };
	}

	return { type: 'direct' };
}

browser.proxy.onError.addListener((error) => {
	console.error(`Proxy error: ${error.message}`);
});
