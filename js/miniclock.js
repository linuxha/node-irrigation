//<!-- <span id="miniclock"><noscript>Enable JS to see clock</noscript></span>
//<script language="JavaScript" type="text/javascript">
//<!-- JavaScript Clock Provided by SEO Scripts Pro Demo - http://demo.scriptalicious.com/seoscripts/ -->

function runMiniClock() {
    var time    = new Date();
    var hours   = time.getHours();
    var minutes = time.getMinutes();
    var subDate = time.toString().substring(0, 15);
    minutes =((minutes < 10) ? "0" : "") + minutes;
    ampm    = (hours >= 12)  ? "PM" : "AM";
    hours   =(hours > 12)    ? hours-12 : hours;
    hours   =(hours == 0)    ? 12 : hours;

    var clock = subDate + " " + hours + ":" + minutes + " " + ampm;

    if(clock != document.getElementById('miniclock').innerHTML) {
        document.getElementById('miniclock').innerHTML = clock;
    }

    timer = setTimeout("runMiniClock()",5000);
}
