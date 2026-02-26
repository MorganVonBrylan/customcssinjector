"use strict";

function onError(error) {
	console.warn("[Crayon] An error occurred:", error);
}

function update()
{
	browser.storage.local.get().then(items => {
		if(items.customCSSObj !== null)
			apply(items.customCSSObj, items.whitelist, items.blacklist);
	}, onError);
}

update();
browser.storage.local.onChanged.addListener(update);
navigation.addEventListener("navigate", update);

// Takes in a String parameter of the CSS code and applies it to the DOM
// or updates the DOM if the style element already exists.
// Conditional statements for whitelist and blacklists if user applied.
function apply(customCSSObj, whitelist, blacklist)
{
	console.log("[Crayon custom CSS Injector] Applied custom CSS.");

	const hostname = window.location.hostname;
	if(matchList(blacklist, hostname) || !matchList(whitelist, hostname, true))
	{
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

function matchList(list, domain, trueIfEmpty = false)
{
	if(!list) return trueIfEmpty;
	if(!Object.keys(list).length && trueIfEmpty) return true;
	return list.hostnames?.includes(domain)
		|| list.domainNames?.some(d => domain.endsWith(d.substring(2))); // *.thing.com
}

function setCSS(id, css)
{
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
