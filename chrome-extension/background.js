// Service worker — keeps extension alive; all API calls go through content.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Trading Analyzer] Extension installed');
});
