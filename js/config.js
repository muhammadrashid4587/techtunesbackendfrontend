// Shared config and helpers for TechTunes front-end
(function(){
  const DEFAULT_API_BASE = `${location.protocol}//${location.hostname}:8001`;
  const storedBase = sessionStorage.getItem('apiBase');
  const API_BASE = storedBase || DEFAULT_API_BASE;

  function setApiBase(url){ sessionStorage.setItem('apiBase', url); }
  function getApiBase(){ return sessionStorage.getItem('apiBase') || DEFAULT_API_BASE; }

  function setToken(key, value){ if (value) sessionStorage.setItem(key, value); }
  function getToken(key){ return sessionStorage.getItem(key) || null; }
  function clearToken(key){ sessionStorage.removeItem(key); }

  // Expose globally in a safe namespace
  window.TechTunes = window.TechTunes || {};
  window.TechTunes.API_BASE = API_BASE;
  window.TechTunes.setApiBase = setApiBase;
  window.TechTunes.getApiBase = getApiBase;
  window.TechTunes.setToken = setToken;
  window.TechTunes.getToken = getToken;
  window.TechTunes.clearToken = clearToken;
})();
