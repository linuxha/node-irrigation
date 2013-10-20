function myTimeStamp() {
    var time    = new Date();
    var hours   = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    var subDate = time.toString().substring(0, 15);

    minutes =((minutes < 10) ? "0" : "") + minutes;
    seconds =((seconds < 10) ? "0" : "") + seconds;
    ampm    = (hours >= 12)  ? "PM" : "AM";
    hours   = (hours > 12)   ? hours-12 : hours;
    hours   = (hours == 0)   ? 12 : hours;

    var clock = hours + ":" + minutes + ":" + seconds + ' ' + ampm;
    return(clock);
}

// ---------------------------------------------------------------------------
var MAX_DUMP_DEPTH = 10;

function dumpObj(obj, name, indent, depth) {
    if(indent === undefined ) {
	indent = "";
    }

    if(name === undefined ) {
	name = "";
    }

    if(depth === undefined) {
	depth = 0;
    }

    if (depth > MAX_DUMP_DEPTH) {
        return indent + name + ": <Maximum Depth Reached>\n";
    }

    if (typeof obj == "object") {
        var child  = null;
        var output = indent + name + "\n";

        indent += "\t";

        for (var item in obj) {

            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }

            if (typeof child == "object") {
                output += dumpObj(child, item, indent, depth + 1);
            } else {
                output += indent + item + ": " + child + "( " + typeof item + "/" + typeof child +" )\n";
            }
        }

        return output;
    } else {
	if(obj === undefined) {
	    console.log("obj undefined");
	}
        return obj;
    }
}

// ---------------------------------------------------------------------------

function gLedSet(state, nom) {
    if(state == 'Off') {
      $("#" + nom).css('background-color', 'darkred');
    } else {
      $("#" + nom).css('background-color', 'red');
    }
}
// Click to hide/unhide the aisle, njc

function manualSet(nom) {
  $(document).ready(function(){
    c = $("#" + nom).css('background-color');

    if(c == 'rgb(255, 0, 0)') {
      $("#" + nom).css('background-color', 'darkred');
      //
      document.getElementById(nom).title ="Status: Off";
      // We should clear the timer but in production we won't use it
    } else {
      $("#" + nom).css('background-color', 'red');
      // Set the status
      document.getElementById(nom).title ="Status: On";

      state = 'Off';
      var ledSet = function () {
        if(state == 'Off') {
          $("#" + nom).css('background-color', 'darkred');
          document.getElementById(nom).title ="Status: Off";
        } else {
          $("#" + nom).css('background-color', 'red');
          document.getElementById(nom).title ="Status: On";
        }
        c = $("#" + nom).css('background-color');
        console.log("Change:" + nom + ": " + c +"\nz1: " + $("#z1").css('background-color'));
      }
      tID = setTimeout(ledSet, 10000);
    }

    c = $("#" + nom).css('background-color');
    console.log(nom + ": " + c +"\nz1: " + $("#z1").css('background-color'));
  });
}

function mytoggle(zap) {
  if(document.getElementById) {
    var a = document.getElementById(zap).style;
    if(a.display != "none") {
      a.display = "none";
    } else {
      a.display ="block";
    }
    return false;
  } else {
    return true;
  }
}

function ledSet(pin, state) {
  var zone = '#z' + pin;

  $(document).ready(function(){
    if(state == 'Off') {
      $(zone).css('background-color', 'darkred');
      // Set the status
      $(zone).title = "Status: Off";
    } else {
      $(zone).css('background-color', 'red');
      // Set the status
      $(zone).title = "Status: On";
    }
  });
}
