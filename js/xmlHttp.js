// =============================================================================
// http://www.xul.fr/en-xml-ajax.html

// From MH : ~/mh/web/test/ajax_example5.shtml
function jsonHttpGet(jsonURL) {
        var xmlHttpReq = false;
        var self = this;

        if (window.XMLHttpRequest) {
                // Mozilla/Safari
                self.xmlHttpReq = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
                // IE
                self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
        }

        jsonURL = strURL + "?sid=" + Math.random(); // keeps file from getting cached
        self.xmlHttpReq.open('GET', jsonURL, true);

        self.xmlHttpReq.onreadystatechange = function() {
                if (self.xmlHttpReq.readyState == 4) {
                        //var doc = eval('(' + req.responseText + ')'); // Note that it's not responseXML
                        var x = self.xmlHttpReq.responseText.getElementsByTagName('response');
                        for(i in x) {
                                
                        // The date:
                        //
                        // { 
                        //   "menu": "File", 
                        //   "commands": [ 
                        //       {
                        //           "title": "New", 
                        //           "action":"CreateDoc"
                        //       }, 
                        //       {
                        //           "title": "Open", 
                        //           "action": "OpenDoc"
                        //       }, 
                        //       {
                        //           "title": "Close",
                        //           "action": "CloseDoc"
                        //       }
                        //    ] 
                        // }
                        //
                        // Using the data:
                        //
                        //   var menuName   = document.getElementById('menu');  // finding a field (menu was jsmenu)
                        //   menuName.value = doc.menu.value;                   // assigning a value to the field
                        //
                        // How to access data:
                        //
                        //   doc.commands[0].title      // read value of the "title" field in the array
                        //   doc.commands[0].action     // read value of the "action" field in the array

                        // Simplified response:
                        // {
                        //   'response': {
                        //     'TempIndoor':'32.5',
                        //     'HumidIndoor':'101.5',
                        //     'TempOutdoor':'1',
                        //     'HumidOutdoor':'2',
                        //     'DewOutdoor':'3',
                        //     'WindAvgSpeed':'4',
                        //     'WindAvgDir':'5',
                        //     'WindChill':'6',
                        //     'Barom':'7',
                        //     'RainTotal':'8',
                        //     'RainRate':'9',
                        //   }
                        // }
                        //
                        // var x = self.xmlHttpReq.responseXML.getElementsByTagName('object');
                        //
                        // This can be access as
                        //   response.TempIndoor
                        // or
                        //   for(i in str) { print('I = ' + i); for(j in str[i]) { print('J = ' + j + ' ' + str[i][j]); } }
                        //     I = response
                        //     J = TempIndoor 32.5
                        //     J = HumidIndoor 101.5
                        //     J = TempOutdoor 1
                        //     J = HumidOutdoor 2
                        //     J = DewOutdoor 3
                        //     J = WindAvgSpeed 4
                        //     J = WindAvgDir 5
                        //     J = WindChill 6
                        //     J = Barom 7
                        //     J = RainTotal 8
                        //     J = RainRate 9
                        //
                        }
                }
        }
        self.xmlHttpReq.send(null);
}

function xmlHttpGet(strURL) {
	var xmlHttpReq = false;
	var self = this; 
	// Mozilla/Safari
	if (window.XMLHttpRequest) {
		self.xmlHttpReq = new XMLHttpRequest();
	} 
	// IE
	else if (window.ActiveXObject) {
		self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
	}
	strURL = strURL + "?sid=" + Math.random();
	self.xmlHttpReq.open('GET', strURL, true);
	self.xmlHttpReq.onreadystatechange = function() {
		if (self.xmlHttpReq.readyState == 4) {
			var i;
			var elmntName = '';
			var x = self.xmlHttpReq.responseXML.getElementsByTagName('response'); // responseXML or responseText
			for (i = 0; i < x[0].childNodes.length; i++) {
				var e;

				if (x[0].childNodes[i].nodeType != 1) {
					continue;
				}

				elmntName = x[0].childNodes[i].nodeName; 
				e = document.getElementById(elmntName);

				// Skip over any result elements that aren't defined on our page
				if (e) {
					// Existing elements are updated here
					if (x[0].childNodes[i].firstChild) {
						// e.innerHTML = x[0].childNodes[i].firstChild.nodeValue; // no text from inside HTML
						// e.innerHTML = x[0].childNodes[i].firstElementChild.nodeValue; // no text from inside HTML
						// innerContent is IE, textContent is everyone else
						e.innerHTML = x[0].childNodes[i].textContent; // all text but no HTML
					} else { 
						e.innerHTML = '';
					}
				}
			}
		}
	}
	self.xmlHttpReq.send(null);
}
