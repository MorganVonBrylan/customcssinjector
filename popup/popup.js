(async function() {
"use strict";
const $ = Bliss, $$ = Bliss.$;

$("#btnOverview").addEventListener("click", () => window.open("/overview/index.html"));

const unsavedChanges = $("#unsaved-changes");
const txtAreaCSS = $("#txtAreaCSS");
const scopeInfo = $("#scopeInfo");
txtAreaCSS.value = "";
txtAreaCSS.addEventListener("input", () => unsavedChanges.hidden = false);
const whitelistText = $("#whitelistText");
const blacklistText = $("#blacklistText");

function onError(error) {
	console.info("[Crayon] An error occurred:", error);
}

const rglobal = $("#rglobal");
const rdomain = $("#rdomain");
const rurl = $("#rurl");
let currentTab = rglobal;
function selectTab(radioBtn) {
	currentTab = radioBtn;
	currentTab.checked = true;
	updateScopeText();
}
function updateScopeText() {
	scopeInfo.innerHTML = currentTab === rglobal ? "This will apply everywhere"
		: currentTab === rdomain ? `This will apply on <code>${activeTabDomain}</code>`
		: `This will apply on <code>${activeTabUrl}</code>`;
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
	updateScopeText();
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
	// On special tabs like about:addons, crash here. Can't select special tabs.

rglobal.value = "css";
rurl.value = activeTabUrl;
rdomain.value = activeTabDomain;

browser.storage.local.get().then(items => {
	txtAreaCSS.value = filterCustomCSSObj(items.customCSSObj);
	whitelistText.value = parseList(items.whitelist);
	blacklistText.value = parseList(items.blacklist);
}, onError);

function parseList(list) {
	if(!list) return "";
	return Object.values(list)
		.map(sublist => !sublist ? "" : Array.isArray(sublist) ? sublist : sublist.split(","))
		.flat().join(",");
}

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
	updateScopeText();
	return tempCSSObj.css || "";	
}

// Upon clicking 'Save', save the custom CSS to browser storage
// This will call update() in customcss.js and apply the CSS to the DOM
$("#btnSubmit").addEventListener("click", async () => {
	const customCSS = txtAreaCSS.value;
	if(rglobal.checked)
		tempCSSObj.css = customCSS;
	else if(rurl.checked)
		tempCSSObj[activeTabUrl] = customCSS;
	else
		tempCSSObj[activeTabDomain] = customCSS;
	
	await browser.storage.local.set({
		customCSSObj: cleanup(tempCSSObj),
		whitelist: stringToList(whitelistText.value),
		blacklist: stringToList(blacklistText.value),
	});
	unsavedChanges.hidden = true;
});

function stringToList(string) {
	const domains = string.split(",");
	const obj = Object.create(null);
	for(const domain of domains.filter(Boolean))
	{
		const sublist = domain[0] === "*" ? "domainNames" : "hostnames";
		if(sublist in obj) obj[sublist].push(domain);
		else obj[sublist] = [domain];
	}
	return obj;
}


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

})(); // end IIFE