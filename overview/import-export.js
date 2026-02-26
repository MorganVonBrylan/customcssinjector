
const $ = Bliss, $$ = Bliss.$;
const btnExport = $("#btnExport");
const btnImport = $("#btnImport");

btnExport.addEventListener("click", async function() {
	this.disabled = true; // block spam click
	const data = JSON.stringify(await browser.storage.local.get());
    const link = $.create("a", {
		href: `data:application/json;charset=utf-8,${encodeURIComponent(data)}`,
		download: "customCSS.json",
	});
	link.click();
	this.disabled = false;
});

const fileAsker = $.create("input", {
	type: "file",
	accept: "application/json",
});
btnImport.addEventListener("click", () => {
	if(window.confirm("⚠️ Importing a file will overwrite all your current CSS, whitelist and blacklist."))
		fileAsker.click();
});
fileAsker.addEventListener("change", function() {
	const file = this.files[0];
	const reader = new FileReader();
	reader.readAsText(file);
	reader.onload = async () => {
		const data = parseImport(reader.result);
		if(!data)
			return window.alert("The provided file was invalid.");

		// to exclude all other properties
		const { customCSSObj, whitelist, blacklist } = data;
		await browser.storage.local.set({ customCSSObj, whitelist, blacklist });
		location.reload();
	};
});


function parseImport(obj)
{
	try {
		obj = JSON.parse(obj);
	} catch {
		return false;
	}
	if(
		typeof obj !== "object" || Array.isArray(obj)
		|| (typeof obj.customCSSObj !== "object" || Array.isArray(obj.customCSSObj))
		|| !parseList(obj.whitelist)
		|| !parseList(obj.blacklist)
	)
		return false;

	return obj;
}
function parseList(list)
{
	if(!list) return true;
	return parseSubList("hostnames")
		&& parseSubList("domainNames");

	function parseSubList(name) {
		return !list[name] ? list[name] = []
			: typeof list[name] === "string" ? list[name] = list[name].split(",")
			: Array.isArray(list[name]);
	}
}