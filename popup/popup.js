(async function() {
"use strict";
const $ = Bliss, $$ = Bliss.$;

const unsavedChanges = $("#unsaved-changes");
const txtAreaCSS = $("#txtAreaCSS");
txtAreaCSS.value = "";
txtAreaCSS.addEventListener("input", () => unsavedChanges.hidden = false);
const whitelistText = $("#whitelistText");
const blacklistText = $("#blacklistText");

function onError(error) {
	console.info("[Crayon] An error occurred:", error);
}

const rglobal = $("#rglobal");
const rurl = $("#rurl");
const rdomain = $("#rdomain");
let currentTab = rglobal;
function selectTab(radioBtn) {
	currentTab = radioBtn;
	currentTab.checked = true;
}

function switchTab()
{
	if(!unsavedChanges.hidden &&
	   !confirm("You have unsaved changes.\nThey will be lost if you switch tabs before saving.")
	)
		return currentTab.checked = true;

	currentTab = this;
	txtAreaCSS.value = tempCSSObj[this.value] || "";
	unsavedChanges.hidden = true;
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
	txtAreaCSS.value = filterCustomCSSObj(items.customCSSObj);
	whitelistText.value = items.whitelist?.hostnames || "";
	blacklistText.value = items.blacklist?.hostnames || "";
}, onError);

// Checks the current active tab domain/url against the CSS object and applies appropriate radio button
function filterCustomCSSObj(customCSSObj)
{
	tempCSSObj = customCSSObj || {}; // Set global css in temp object to retain global style-sheet.
	if(activeTabUrl in tempCSSObj)
	{
		selectTab(rurl);
		return tempCSSObj[activeTabUrl];
	}
	if(activeTabDomain in tempCSSObj)
	{
		selectTab(rdomain);
		return tempCSSObj[activeTabDomain];
	}
	return tempCSSObj.css || "";	
}

// Upon clicking 'Save', save the custom CSS to browser storage
// This will call update() in customcss.js and apply the CSS to the DOM
$("#btnSubmit").addEventListener("click", async () => {
	const customCSS = txtAreaCSS.value;
	const whitelistHostnames = whitelistText.value;
	const blacklistHostnames = blacklistText.value;
	if(rglobal.checked)
		tempCSSObj.css = customCSS;
	else if(rurl.checked)
		tempCSSObj[activeTabUrl] = customCSS;
	else
		tempCSSObj[activeTabDomain] = customCSS;
	
	await browser.storage.local.set({
		customCSSObj: cleanup(tempCSSObj),
		whitelist: { hostnames: whitelistHostnames },
		blacklist: { hostnames: blacklistHostnames },
	});
	unsavedChanges.hidden = true;
});

// Checks for and removes empty string values in customCSSObj
function cleanup(customCSSObj)
{
	if(!customCSSObj.css)
		delete customCSSObj.css;
	if(!customCSSObj[activeTabDomain])
		delete customCSSObj[activeTabDomain];
	if(!customCSSObj[activeTabUrl])
		delete customCSSObj[activeTabUrl];
	
	return customCSSObj;
}

$("#btnOverview").addEventListener("click", () => window.open("/overview/index.html"));

})(); // end IIFE