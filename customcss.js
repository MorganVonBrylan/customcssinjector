"use strict";

function update() {
	browser.storage.local.get().then(onGot, onError);
}

update();
browser.storage.local.onChanged.addListener(update);

// Get CSS and whitelist/blacklist from storage object and call apply()
function onGot(items) {
	if (items.customCSSObj !== null) {
		apply(items.customCSSObj, items.whitelist, items.blacklist);
	}
}

// Error checking when obtaining CSS from storage
function onError(error) {
	console.info("An error occurred: " + error);
}

// Takes in a String parameter of the CSS code and applies it to the DOM
// or updates the DOM if the style element already exists.
// Conditional statements for whitelist and blacklists if user applied.
function apply(customCSSObj, whitelist, blacklist) {
	console.log("[Crayon custom CSS Injector] Applied custom CSS.");

	const hostname = window.location.hostname;
	if (blacklist?.hostnames.includes(hostname)
		|| (whitelist?.hostnames && !whitelist.hostnames.includes(hostname)
	)) {
		for(const elm of document.querySelectorAll("[id^=custom-css-injector]"))
			elm.remove();
	}
	else
	{
		setCSS("global", customCSSObj.css);
		setCSS("domain", customCSSObj[hostname]);
		setCSS("url", customCSSObj[getUrl()]);
	}
}

function setCSS(id, css) {
	id = `custom-css-injector-${id}`;
	const styleElm = document.getElementById(id);
	if(styleElm)
		styleElm.textContent = css;
	else
	{
		const styleElm = document.createElement("style");
		styleElm.id = id;
		styleElm.textContent = css;
		document.documentElement.appendChild(styleElm);
	}
}

function getUrl() {
	return window.location.hostname + window.location.pathname;
}


// Handles message from Popup script and returns the URL and DOMAIN name of the active tab.
browser.runtime.onMessage.addListener(request => {
  return Promise.resolve({domain: window.location.hostname, url: getUrl()});
});
