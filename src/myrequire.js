// a simple JavaScript source code loader
function myRequire(src, callback) {
  var libraries,
      ie = false,
      script = document.createElement("script"); 
  if (src.constructor === Array) {
    libraries = src;
  } else {
    libraries = [src];
  }
  script.type = "text/javascript";
  // IE
  script.onreadystatechange = function () {
    ie = true;
    if (script.readyState === 'loaded' || script.readyState === 'complete') {
      script.onreadystatechange = null;
      libraries.shift();
      if (libraries.length > 0) {
        myRequire(libraries);
      }
      if (callback) {
        callback();            
      }
    }
  };
  // Not IE
  script.onload = function () {
    if (!ie) {
      libraries.shift();
      if (libraries.length > 0) {
        myRequire(libraries);
      }
      if (callback) {
        callback();            
      }
    }
  };
  script.src = libraries[0];
  document.getElementsByTagName("head")[0].appendChild(script);
}
