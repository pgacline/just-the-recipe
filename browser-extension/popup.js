const SITE_URL = "https://cuttotherecipe.com";

document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const statusDiv = document.getElementById("status");
  
  if (!tab.url || tab.url.startsWith("chrome://")) {
    statusDiv.textContent = "Can't extract from this page.";
    return;
  }

  statusDiv.textContent = "Opening Cut to the Recipe...";
  
  const targetUrl = `${SITE_URL}?url=${encodeURIComponent(tab.url)}`;
  chrome.tabs.create({ url: targetUrl });
});
