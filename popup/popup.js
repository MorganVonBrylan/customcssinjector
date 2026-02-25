(async function() {
"use strict";
const $ = Bliss, $$ = Bliss.$;

$("#txtAreaCSS").value = "";

function onError(error) {
	console.info("[Crayon] An error occurred:", error);
}

const rglobal = $("#rglobal");
const rurl = $("#rurl");
const rdomain = $("#rdomain");

function switchTab() {
	if(this.checked)
		$("#txtAreaCSS").value = tempCSSObj[this.value] || "";
}
for(const radioBtn of $$("input[type=radio]"))
	radioBtn.addEventListener("change", switchTab);

// JSON Object that contains all CSS
let tempCSSObj;
const {
	domain: activeTabDomain,
	url: activeTabUrl,
} = await browser.tabs.query({ currentWindow: true, active: true })
	.then(([{id}]) => browser.tabs.sendMessage(id, { message: "getwebsitedata" }))
	.catch(onError);

rglobal.value = "css";
rurl.value = activeTabUrl;
rdomain.value = activeTabDomain;

browser.storage.local.get().then(items => {
	$("#txtAreaCSS").value = filterCustomCSSObj(items.customCSSObj);
	$("#whitelistText").value = items.whitelist?.hostnames || "";
	$("#blacklistText").value = items.blacklist?.hostnames || "";
}, onError);

// Checks the current active tab domain/url against the CSS object and applies appropriate radio button
function filterCustomCSSObj(customCSSObj)
{
	tempCSSObj = customCSSObj || {}; // Set global css in temp object to retain global style-sheet.
	if(activeTabUrl in tempCSSObj)
	{
		rurl.checked = true;
		return tempCSSObj[activeTabUrl];
	}
	if(activeTabDomain in tempCSSObj)
	{
		rdomain.checked = true;
		return tempCSSObj[activeTabDomain];
	}
	return tempCSSObj.css || "";	
}

// Upon clicking 'Save', save the custom CSS to browser storage
// This will call update() in customcss.js and apply the CSS to the DOM
$("#btnSubmit").addEventListener("click", () => {
	const customCSS = $("#txtAreaCSS").value;
	const whitelistHostnames = $("#whitelistText").value;
	const blacklistHostnames = $("#blacklistText").value;
	if(rglobal.checked)
		tempCSSObj.css = customCSS;
	else if(rurl.checked)
		tempCSSObj[activeTabUrl] = customCSS;
	else
		tempCSSObj[activeTabDomain] = customCSS;
	
	browser.storage.local.set({
		customCSSObj: cleanup(tempCSSObj),
		whitelist: { hostnames: whitelistHostnames },
		blacklist: { hostnames: blacklistHostnames },
	});
});

// Checks for and removes empty string values in customCSSObj
function cleanup(customCSSObj)
{
	for(const key in customCSSObj)
		if(!customCSSObj[key])
			delete customCSSObj[key];
	return customCSSObj;
}

$("#btnOverview").addEventListener("click", () => window.open("/overview/index.html"));

})(); // end IIFE