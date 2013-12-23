/**
** irrnode.js - A web irrigation control server to my irrigation system
** ---------------------------------------------------------------------------
** @FIXME
**  - @FIXED added sound to the run/stop switch, not sure if it works on the tablet
**  - Need a way to send the updates of the current Zones status.
**  - Need to figure out how to turn off the current running zone when the run/stop is hit.
**  - Need a way to update the browser of the current status of the controller.
**  - Need to send the current status of the controller to the broswer on connect.
**  - Need a reset switch when things get really messed up (so we can get back in sync).
**  - Hmm, what if 2 or more 'programs' are running? How do we deal with that
**    status? Array of statuses?
**  - @FIXED Currently we can only handle 6 steps (because I've crossed that
**    with the 6 hard coded zones. Need to fix that.
**  - Need to make the zones configurable (client and server). This information
**    is in the irrigation.json so it is readable (and later configurable).
**  - Need to work on the configuration section.
**  - @FIXED: need a way to translate the Zone and Pin in the irrigation.json
**    (added the zone - browser side, pin & port - device side, info to the
**    zones array object)
**  - FIXME: We're getting Errors/exceptions from the node.js program that are
**    not being caught. So far I'm uncertain where the problem is (see bottom
**    for more details
**  - FIXME: Need to be able to tell that the device we're talking too is there
**    so we can tell the user if we're just talking to ourselves (UDP)
**  - TODO: Need to build the config pages
**          and I need to make it handle the empty config files.
**  - TODO: build the programs page
**  - TODO: Build the external conditions page
**  - FIXME: Fix the updates for the tablets, such that if it hasn't been updated recently a forced update occurs
**  - TODO: Add support for the current active zone(s)
** ---------------------------------------------------------------------------
**
** @author      Neil Cherry <ncherry@linuxha.com>
** @version     0.1 (alpha)
** ---------------------------------------------------------------------------
*/

// References
// https://github.com/LearnBoost/socket.io

// ---------------------------------------------------------------------------
// The first thing you need to do is load the modules required for your app,
// in this case we need the http, sys, url, querystring, and fs modules.
var http   = require("http");
var util   = require("util");
var url    = require("url");
var qs     = require("querystring");
var fs     = require("fs");
var events = require('events');
var io     = require('socket.io');
var tls    = require('tls');
var usage  = require('usage');
var syslog = require('syslog');

var startTime   = Date.now();
var currentTime = startTime;

/*
facility = auth authpriv cron daemon ftp kern lpr mail news security
           syslog user uucp local0 local1 local2 local3 local4 local5
           local6 local7
level    = alert crit debug emerg err error info notice panic warning warn
*/
var logger = syslog.createClient(514, 'localhost', { name: 'irrnode', facility: syslog.user }); // 1 = user level

logger.info("irrnode", syslog.LOG_NOTICE);

var pid = process.pid;
var options = { keepHistory: true };
// By default CPU Percentage provided is an average from the starting
// time of the process. It does not correctly reflect the current CPU
// usage.
//
// But If you call usage.lookup() continuously for a given pid, you
// can turn on keepHistory flag and you'll get the CPU usage since
// last time you track the usage. This reflects the current CPU usage.
util.inspect(process.memoryUsage());

// -[ daemon() ]--------------------------------------------------------------
// after this point, we are a daemon
require('daemon')();

/**
**
*/
/*
var serverOptions = {
 key:  fs.readFileSync('tls/my_server_key.pem'),
 cert: fs.readFileSync('tls/my_server_cert.pem')
};

//var server = tls.createServer(serverOptions);
*/

var userCount = 0;
var run = true;			// Run/Stop flag

// Future (to replace Etherio)
//var dev = require('Device');

// -[ Etherio ]--------------------------------------------------------------

/**
** dec2hex - converts the decimal value to a hex string
**
** @param	i - decimal value
**
** @returns	string
*/
function dec2hex(i) {
    return (i+0x100).toString(16).substr(-2).toUpperCase();
}
// ----------------------------------------------------------------------------

// TODO Eventually I'll turn this into a Node.js module

/**
** Etherio constructor - for accessing the Etherio IO24R 24 port digital IO device
**
** Returns a new etherio object for the Elexol Etherio24R
**
** @param	ip host identifier (ip address or FQDN)
** @param	port number to communicate with the etherio device (default 2424)
**
** @returns	new etherio object
*/
// function Etherio(ip, port)
Etherio = function(ip, port) {
    var dgram = require('dgram');

    this.ip   = ip;             // Can be name or ipv4 address
    this.port = typeof b !== 'undefined' ? port : 2424;         // port number

    // this turns this into a public properties
    this.zone = []; // new Array();

    this.zone.A = 0; // this.zone['A'] = 0;
    this.zone.B = 0;
    this.zone.C = 0;

    // Note that we haven't connected to the device yet
    this.client = dgram.createSocket("udp4");

    // http://stackoverflow.com/questions/6475842/node-js-udp-dgram-handling-error-from-dns-resolution
    // listen for the error (hopefully this will resolve the issue of the uncaught dns error)
    this.client.on("error", function (err) {
        logger.info("Socket error: " + err);
    });

    //
    this.client.on('message', function (message, remote) {
        logger.info("The packet came back: " + message.toString('ascii', 0, rinfo.size));
    });

    // Technically, since it's UDP, we never connect to the device but when a
    // packet is sent it's done in the on, off and ping methods

    /*
    ** TODO: Need to add the device init sequence here.
    **
    ** set the IO ports to Out
    **
    ** # 0 for output
    ** # 1 for input
    ** #
    ** # echo -e '!A\x00!B\x00!C\x00' | nc -w 2 -u etherio24.uucp 2424 | od -x
    ** 0000000
    ** send A\x00 B\x00 C\x00
    ** recv nothing
    ** # echo -e '!a!b!c' | nc -w 2 -u etherio24.uucp 2424 | od -x
    ** 0000000 0a43 4121 2100 0042 4321 0000
    ** 0000013
    ** A = 41
    */
}

/**
** on - turns on a particular Elexol EtherIO port/pin combination
**
** @param	zone object
**
** @returns	nothing
**
** TODO Eventually I'll turn this into a Node.js module
*/
Etherio.prototype.on = function(zone) {
    var val              = (1<<zone.pin);              // Ex. Pin 3 becomes 0000 0100 or 0x04
    val                  = this.zone[zone.port] | val; // Turn on the bit and leave on the existing bits
    this.zone[zone.port] = val;                        // Turn on the bit and leave on the existing bits

    data = new Buffer(3);

    data.write(zone.port, 0);
    //* @FIXED: When we send an 80 (1000 0000) we get a C2 (1100 0010)
    data.write(String.fromCharCode(val&0x00FF), 1, "binary");
    data.write('\n', 2);

    this.client.send(data, 0, data.length, this.port, this.ip);
}

/**
** off - turns on a particular Elexol EtherIO port/pin combination
**
** @param	zone object
**
** @returns	nothing
**
** TODO Eventually I'll turn this into a Node.js module
*/
Etherio.prototype.off = function(zone) {
    var val              = ((~(1<<(zone.pin))) & 0x00FF);
    val                  = this.zone[zone.port] & val;  // Turn off the bit and leave on the existing bits
    this.zone[zone.port] = val;                         // Turn off the bit and leave on the existing bits

    data = new Buffer(3);

    data.write(zone.port, 0);
    data.write(String.fromCharCode(val&0x00FF), 1, "binary");
    data.write('\n', 2);
/*
    logger.info("Off:");
    logger.info(data);
*/
    this.client.send(data, 0, data.length, this.port, this.ip);
}

/**
** ping - validates that the Elexol Ether IO device is available 
**
** @param	none
**
** @returns	true if we get a proper ping repsonse, false othewise
**
** TODO Eventually I'll turn this into a Node.js module
*/
Etherio.prototype.ping = function() {
	// in addition to sending a UDP request
	// we need to 'wait' for a UDP response
	// TODO: build send and receive logic/code
	return true;
};

// ----------------------------------------------------------------------------

// I've switched from node-cron to node-sched
// Hopeully this will resolve the timer issues (node-cron fails to run cron jobs
// if I use a setTimeout inside the job
// Problem solved, not a node-cron problem but the way I build my callback

var schedule = require('node-schedule');

// ----------------------------------------------------------------------------
// Irrigation Configuration
var configPath = "data/irrigation.json";
var config = {
    "ready" : 0,
    "debug" : 2
};

// Irrigation programs
var programsPath = "data/programs.json";
var programs = {
     "ready" : 0
};

// This will need to be in the ramdisk for production
// External Conditions
//   For things like Odd/Even day, wind speed, Temperature
var extCndsPath = "data/extCnds.json";
var extCnds = {
    "ready" : 0
};

var job = [];

var status = {
    "ready" : 0,
    "current": {}
};

// ---------------------------------------------------------------------------
// This is correct because we're outputting the url in the not found message
var NOT_FOUND = "Not Found\n";

/**
 * notFound - typical 404 page
 * @param req - request object (user request)
 * @param res - resource object
 */
function notFound(req, res) {
    res.writeHead(404, [ ["Content-Type", "text/plain"],
                         ["Content-Length", NOT_FOUND.length] ]);
    logger.info('Not Found URL: ' + req.url);
    res.write(NOT_FOUND);
    res.end();
}

// ---------------------------------------------------------------------------
/**
** 
*/
// Signal handling
process.on('SIGINT', function() {
    logger.info('\n');
    logger.info('Got a SIGINT');
    process.exit(0);
});

process.on('SIGHUP', function() {
    logger.info('\n');
    logger.info('Got a SIGHUP');
    process.exit(0);
});

// -[ File loads ]------------------------------------------------------------

// read in the system settings
// At this time I haven't decided how to deal with the security for reading in a JSON Object.
// At some point I'll need to deal with that.

/**
 * fixJSON - remove newlines from JSON striing to ready JSON for parsing
 */
function fixJSON(data) {
    // JSON.parse doesn't like newlines
    // so we cleaned it up
    data = data.replace(/(\n|\r)/gm,"");

    return(JSON.parse(data));
}

// ---------------------------------------------------------------------------
// fs.readFileSync(filename, [options])#
//
// Synchronous version of fs.readFile. Returns the contents of the filename.
//
// If the encoding option is specified then this function returns a
// string. Otherwise it returns a buffer.
//
//    filename String
//    options Object
//        encoding String | Null default = null
//        flag String default = 'r'
// If no encoding is specified, then the raw buffer is returned.
// ---------------------------------------------------------------------------
// irrigation.json - irrigation configuraton
// programs.json   - programs. crontabs, zones and times
// extcnds.json    - External Conditions
// fs.readFile(filename, [options], callback)
/* */
function loadJSON(file) {
    // @FIXME: failed reloads crash the program
    // At the moment we don't have a way of catching a bad reload and continuing
    // with the previous safe load (well we're part way there but not done)
    try {
        var data = fs.readFileSync(file);

        // JSON.parse doesn't like newlines
        // so we cleaned it up
        data = data.toString();
        data = data.replace(/(\n|\r)/gm,"");

        var json = JSON.parse(data);

        return(json);
    }
    catch(err) {
        logger.info("File load error, " + file + "(" + err.message + ")");
        // process.exit(1);
        throw err;
    }
}

// @FIXED: Need to keep track of the state of all the zones, we now havs status.zones

config = loadJSON(configPath);

// -[ setUID ]----------------------------------------------------------------
process.setuid(config.uid);
/*
/home/njc/dev/irrigation/irrnode/sched.js:449
process.setgid(config.gid);
        ^
Error: EPERM, Operation not permitted
    at Object.<anonymous> (/home/njc/dev/irrigation/irrnode/sched.js:449:9)
    at Module._compile (module.js:449:26)
    at Object.Module._extensions..js (module.js:467:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Module.runMain (module.js:492:10)
    at process.startup.processNextTick.process._tickCallback (node.js:244:9)
*/
//process.setgid(config.gid);

status.zones   = config.zones;

programs = loadJSON(programsPath);
logger.info("Programs ready: " + programs.ready);

extCnds  = loadJSON(extCndsPath);
// Need to do a check on the external conditions
// = should be == need to correct when read in
//
// ==
// === I think this is what we need
//
// !=
// !== I think this is what we need
//
// <
// <=
// >
// >=
//
// extCnds = verifyConditions(extCnds);

logger.info("JSON loads done");

var eio = new Etherio("etherio24.uucp", 2424);
logger.info("Created new EtherIO");

// ---------------------------------------------------------------------------
// This re-reads the extCnds.json file each time it changes. But not at startup
// this is because the file hasn't changed yet
fs.watch(extCndsPath, function(action, filename) {
    logger.info("action: "   + action);
    logger.info("filename: " + filename);
    logger.info("filename: " + extCndsPath);

    if(action == "change") {
        // What we need to do is to clone the original, load the new
        // and if there was an error reload the original
        var newObject = JSON.parse(JSON.stringify(extCnds));

        // Now reset the data
        extCnds = {
            "ready" : 0
        };

        try {
            extCnds = loadJSON(extCndsPath);
            extCnds.ready = 1;  // If we get here we were successful

            io.sockets.emit('message', { 'message' : 'External conditions (' + filename + ') updated'} );
            logger.info(JSON.stringify(extCnds));
        }
        catch(e) {
            logger.info("Oops: " + e);
            extCnds = JSON.parse(JSON.stringify(newObject));
            logger.info(JSON.stringify(extCnds));
        }
    }
});

// watching the programs.json file (reload when updated)
// This needs to be setup to be reloaded when there is a change on the file.
fs.watch(programsPath, function(action, filename){ // fs.watchFilename(file, function(curr,prev) { });
    logger.info("action: "  + action);
    logger.info("filename: " + filename);

    if(action == "change") {
        // What we need to do is to clone the original, load the new
        // and if there was an error reload the original

        // http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
        // This will allow a 'clone' of the programs object (but not funtions)
        // var newObject = JSON.parse(JSON.stringify(oldObject));
        var newObject = JSON.parse(JSON.stringify(programs));

        // Now reset the data
        programs = {
            "ready" : 0
        };

        try {
            programs = loadJSON(programsPath);
            programs.ready = 1; // If we get here we were successful

            // Now I need to update the crontabs
            //*
            // Cancel the previous jobs first otherwise both will exist
            for(var j = 0; j < job.length; j = j + 1) {
                job[j].cancel(); // or should I be using cancelJob(i) but job[i].cancel() works
            }

            // Iteration to load the programs into the crontabs
            for(j = 0; j < programs.length; j = j + 1) {
                // it is possiible for a program to be empty (ie null)
                if(programs[j].name !== null) {
                    logger.info("Add crontab[" + j + "]: " + programs[j].name + " // " + programs[j].crontab);

                    // Used with node-sched
                    job[j] = cronSched(programs[j]);
                }
            }
            /* */
            io.sockets.emit('message', { 'message' : 'Programs (' + filename + ') updated'} );
            logger.info(JSON.stringify(programs));
        }
        catch(e) {
            logger.info("Oops: " + e);
            programs = JSON.parse(JSON.stringify(newObject));
        }
    }
});
/* */

// -[ Server ready Event ]----------------------------------------------------
var eventEmitter = new events.EventEmitter();

var socket;

// use socket.io
var io;

// This creates te server when we get a SrvReady event
var SrvRdy = function SrvRdy() {
    // -------------------------------------------------------------------------
    io = require('socket.io').listen(app);

    /*
    ** log level defaults to 3
    ** The amount of detail that the server should output to the logger.
    **    0 - error
    **    1 - warn
    **    2 - info
    **    3 - debug
    */
    io.set('log level', config.logLevel);

    // define interactions with client
    io.sockets.on('connection', function(socket){
        /*
        ** On connect we need to send the current status of the digital IO to
        ** the browser
        */

        // Return the current Run/Stop status
        if(run) {
            socket.emit('Run',  { 'message' : 'true' });
        } else {
            socket.emit('Run',  { 'message' : 'false' });
        }

        //logger.info('Socket connection');
        var address = socket.handshake.address;
        ++userCount;

        logger.info("Connect from " + address.address + ":" + address.port + " (" + userCount + ")");
        socket.emit('message',  { 'message' : 'Ready' });

        // Complete update of the status
        for(i = 0; i < status.zones.length; i++) {
            var z = {};
            z.name  = status.zones[i].name;
            z.zone  = status.zones[i].zone;
            z.state = status.zones[i].state;

            if(z.state == 1){
                io.sockets.emit('On',  z);
            } else {
                io.sockets.emit('Off', z);
            }
        }

    	socket.on('error', function(){
    	    --userCount;

    	    logger.info("Socket error");
    	    logger.info("Error from " + address.address + ":" + address.port + " (" + userCount + ")");

    	    if(userCount < 0) {
    		userCount = 0;
    	    }
    	});

        socket.on('disconnect', function(){
            --userCount;

            //logger.info("Disconnect from " + address.address + ":" + address.port + " (" + userCount + ")");
            logger.info("Disconnect user");

            if(userCount < 0) {
                userCount = 0;
            }
        });

        socket.on('message', function(data) {
            logger.info("socket.on Message = " + data.message + " [" + JSON.stringify(data) + "]");
        });

        socket.on('Reset', function(data) {
            logger.info("Run = " + data.message + " [" + JSON.stringify(data) + "]");
            socket.emit('message',  { 'message' : 'Reset' });
        });

        socket.on('Run', function(data){
            logger.info("Run = " + data.message + " [" + JSON.stringify(data) + "]");

            if(data.message == 'true') {
                run = true;
                //socket.emit('message',  { 'message' : 'Run' });               
                socket.emit('Run',  { 'message' : 'true' });
                /*
                ** http://scottblaine.com/2012/using-socket-io-broadcast-one-some-sockets/
                **
                ** You're probably already familiar with how to broadcast to all connected sockets:
                **
                ** io.sockets.emit('message', {foo:bar});
                **
                ** Sending a message to a single client is
                ** similar. Instead of emitting using io.sockets we
                ** instead just use socket:
                **
                ** socket.emit('message', {foo:bar});
                **
                ** Or we can broadcast to all clients except for one with:
                **
                ** socket.broadcast.emit('message', {foo:bar});
                */
                // Okay so which is better? socket.broadcast.emit or io.sockets.emit?
                // For status updates I'm not sure either matters. If the broadcast
                // really just sends 1 pkt then it's a better choice.
                socket.broadcast.emit('Run',  { 'message' : 'true' });          
            } else {
                run = false;
                //socket.emit('message',  { 'message' : 'Stop' });
                socket.emit('Run',  { 'message' : 'false' });
                socket.broadcast.emit('Run',  { 'message' : 'false' });
                // @FIXME: We need to emit a 'Stop' message so we can properly cleanup any running cronjobs
                // ... so what do we have running when this occurs ?

		// Okay first thing I want to do is to dump the current running
		// program(s) [ function on(curProgram, nthStep) ]
		// status.zones[curProgram.steps[nthStep].zone-1].state = 1;
		logger.info("Stop, status:  " + JSON.stringify(status.zones));
		/*
		** Dec 21 22:47:15 Mozart irrnode[5723](1): Run = false [{"message":"false"}]
		** Dec 21 22:47:15 Mozart irrnode[5723](1):
		** Stop, status:  [
		**   {"name":"Zone 1","zone":"1","port":"A","pin":"0","state":0,"device":{"port":"A","pin":"0"}},
		**   {"name":"Zone 2","zone":"2","port":"A","pin":"1","state":0,"device":{"port":"A","pin":"1"}},
		**   {"name":"Zone 3","zone":"3","port":"A","pin":"2","state":0,"device":{"port":"A","pin":"2"}},
		**   {"name":"Zone 4","zone":"4","port":"A","pin":"3","state":0,"device":{"port":"A","pin":"3"}},
		**   {"name":"Zone 5","zone":"5","port":"A","pin":"4","state":0,"device":{"port":"A","pin":"4"}},
		**   {"name":"Zone 6","zone":"6","port":"A","pin":"5","state":0,"device":{"port":"A","pin":"5"}},
		**   {"name":"Zone 7","zone":"7","port":"A","pin":"6","state":0,"device":{"port":"A","pin":"6"}},
		**   {"name":"Zone 8","zone":"8","port":"B","pin":"7","state":0,"device":{"port":"B","pin":"7"}},
		**   {"name":"Zone 9","zone":"9","port":"B","pin":"1","state":0,"device":{"port":"B","pin":"1"}},
		**   {"name":"Zone 10","zone":"10","port":"B","pin":"2","state":0,"device":{"port":"B","pin":"2"}},
		**   {"name":"Zone 11","zone":"11","port":"B","pin":"3","state":0,"device":{"port":"B","pin":"3"}},
		**   {"name":"Zone 12","zone":"12","port":"B","pin":"4","state":0,"device":{"port":"B","pin":"4"}},
		**   {"name":"Zone 13","zone":"13","port":"B","pin":"5","state":0,"device":{"port":"B","pin":"5"}},
		**   {"name":"Zone 14","zone":"14","port":"B","pin":"6","state":0,"device":{"port":"B","pin":"6"}},
		**   {"name":"Zone 15","zone":"15","port":"B","pin":"7","state":0,"device":{"port":"B","pin":"7"}},
		**   {"name":"Zone 16","zone":"16","port":"B","pin":"8","state":0,"device":{"port":"B","pin":"8"}}
		** ]
		*/

		// Status: 1:43:34 PM Program 1, Zone : 8: Off <- Normal off
		// Status: 1:43:34 PM Undefined, Zone : 8: Off <- Stop
		/* */
		for(i = 0; i < status.zones.length; i = i + 1) {
		    if(status.zones[i].state) {
			var z = {};
			// only need the zones, port and pin passed
			z.name = "Stop";
			z.zone = status.zones[i].zone;
			z.port = status.zones[i].port;
			z.pin  = status.zones[i].pin;

			logger.info("Stop:  " + JSON.stringify(z));

			eio.off(z);
			status.zones[i].state = 0;
			// also need to send an update to the browser to turn
			// off the status LEDs

			// This helps fix the emit errors which would occurr
			// when no client's were connected
			if(userCount >  0) {
			    try {
				io.sockets.emit('Off', z);
			    }
			    catch(e) {
				logger.info("Oops-off: " + e + " (" + userCount + ")");
			    }
			}
		    }
		}
		/* */
            }
        });

        socket.on('disconnect', function() { // this code is in irrnode.js
            var address = socket.handshake.address;
            --userCount;
            logger.info("Disconnect from " + address.address + ":" + address.port + " (" + userCount + ")");
            //logger.info("Disconnect user");

            if(userCount < 0) {
                userCount = 0;
            }
        });

    });

/*
    socket = io.listen(app);
    socket.configure( function() {
        socket.set('close timeout', 60*60*24); // 24h time out
    });
//*
    socket.on('keep-alive', function (data) {
        socket.emit('keep-alive', null);
    });
/* */

    // ---------------------------------------------------------------------------
    logger.info('Server running at http://' + config.ip + ":" + config.port + '/ (SrvReady)');
};

eventEmitter.once('SrvReady', SrvRdy); //

/*
** I'm trying to keep this simple, check the condition, if true test the
** next condition. If false return right away (a false makes an OR logic false).
*/
function conditionsCheck(conditionsArray) {
    // Check for the run state
    if(run != true) {
	logger.info("Run: " + run);
	return false;
    }

    // conditionsArray contains an array of conditions that must meet true to continue
    // loop through the conditions while true
    for(var i = 0; i < conditionsArray.length; i++) {
	// We need to skip blank lines or undefined/empty entries (done)
	// If empty or undefined or comment (not done)
	if(!((conditionsArray[i] == undefined) || (conditionsArray[i] == ''))) {
	    // Okay these should be something we can eval ('' and undefined eval false)
	    try {
		if(!eval(conditionsArray[i])) {
		    logger.info("Eval: false, " + conditionsArray[i] + " (" + i + ") " + extCnds);
		    return false;
		}
	    }
	    catch(e) {
		logger.info("Catch: false, " + conditionsArray[i] + " (" + i + ")");
		return false;
	    }
	}
    }
    return true;
}

// ---------------------------------------------------------------------------
// When we turn on Zone x we need to turn off the zone in the previous step
// and we need to update the status and tell the user and the GPIO
// ---------------------------------------------------------------------------

// Turn on the zone, update the status and turn off the previous zone (if there is one)
function on(curProgram, nthStep) { // curProgram, nthStep
    // Turn off the previous zone
    if( nthStep > 0) {
        off(curProgram, nthStep-1);
    }

    if(conditionsCheck(curProgram.conditions)) {
    	/**
    	***  Technically there could be more than one Zone & Program running at
    	***  the same time.
    	**/
	status.current[curProgram.name].zone = curProgram.steps[nthStep].zone;

        var z = {};
        z.name = curProgram.name;
        z.zone = curProgram.steps[nthStep].zone;
        // This is temporary as I don't know where to put this yet
        z.port = curProgram.steps[nthStep].port;
        z.pin  = curProgram.steps[nthStep].pin;

        logger.info("On:  " + JSON.stringify(z));

        // This is the device interface
        eio.on(z);
	status.zones[z.zone-1].state = 1;

        // This helps to fix the emit errors which woould occurr when no client's were
        // connected
        if(userCount >  0) {
            // Tell the user what's on
            try {
                io.sockets.emit('On', z);
            }
            catch(e) {
                logger.info("Oops-on: " + e + " (" + userCount + ")");
            }
        }
    } else {
	io.sockets.emit('message',  { 'message' : 'Conditions false, ' + "Run == " + run + "," + curProgram.conditions}); //
    }
}

// Turn off the zone, update the status
function off(curProgram, nthStep) {
    status.current[curProgram.name].zone = '';

    var z = {};
    z.name = curProgram.name;
    z.zone = curProgram.steps[nthStep].zone;
    // This is temporary as I don't know where to put this yet
    z.port = curProgram.steps[nthStep].port;
    z.pin  = curProgram.steps[nthStep].pin;

    logger.info("Off: " + JSON.stringify(z));

    // This is the device interface
    eio.off(z);
    status.zones[z.zone-1].state = 1;

    // This helps to fix the emit errors which would occurr when no client's were
    // connected
    if(userCount >  0) {
        try {
            io.sockets.emit('Off', z);
        }
        catch(e) {
            logger.info("Oops-off: " + e + " (" + userCount + ")");
        }
    }
}

/**
** myJobRun - crontab function called by the cron scheduler
**
** @param	currProgram object which consists of the name, cron sched, steps, etc.
** @nthStep	the nth step in the currProgram
*/
function myJobRun(curProgram, nthStep) {
    var step = curProgram.steps[nthStep];

    if(nthStep < curProgram.steps.length) {
        on(curProgram, nthStep);
        // Turn off the previous zone
        // Turn on the program.pin

        setTimeout(function() {
            var nextStep = nthStep + 1;
            myJobRun(curProgram, nextStep);
        }, step.time);
    } else {
        var prevStep = nthStep - 1;
        off(curProgram, prevStep);

	// When we're done with all the steps, remove the program's current status
	logger.info(status.current[curProgram.name].name + " Done");
	delete status.current[curProgram.name];
    }
}

/**
** cronSched
**
** @param	prog is the user program object to be scheduled
**
** @returns	schedule object
*/
function cronSched(prog) {
    var myJob = schedule.scheduleJob(prog.crontab, function() {
        logger.info("Cronjob run: " + prog.name + ' (' + prog.steps.length + ')');
	status.current[prog.name] = { "name" : prog.name, "zone" : '' };

        myJobRun(prog, 0);
    });

    return(myJob);
}

// -[ monitor() ]-------------------------------------------------------------
// Credit to: aioobe from stackoverflow
// http://stackoverflow.com/questions/3758606/how-to-convert-byte-size-into-human-readable-format-in-java
function humanReadableByteCount(memBytes, si) {
    if(typeof si === 'undefined') {
        si = 0;
    }

    unit = si ? 1000 : 1024;	// SI / No SI

    if (memBytes < unit) {
        return memBytes + " B";
    }

    exp = Math.floor(Math.log(memBytes) / Math.log(unit));
    pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");

    return((memBytes / Math.pow(unit, exp)).toFixed(2) + pre);
}

/*
Report the CPU usage, the memory usage and the connected information once an hour.
*/
function monitor(){
    // Uptime currentTime - startTime
    mSec = Date.now() - startTime; // In milliSeconds
    logger.info("Uptime: " + mSec);

    // {"memory":18894848,"cpu":92.30769172575347}
    usage.lookup(pid, options, function(err, result) {
	// CPU
	var cpu = result.cpu.toFixed(2); // result in %
	logger.info("CPU: " + cpu + "%");

	// Memory
	var mem = humanReadableByteCount(result.memory); // result in bytes
	logger.info("Memory: " + mem + " bytes");
    });

    // Connections
    logger.info("Users: " + "n (list follows)");
}

schedule.scheduleJob("0 * * * *", function() {
    monitor();
});

// ---------------------------------------------------------------------------

// Iteration to load the programs into the crontabs
for(var j = 0; j < programs.length; j = j + 1) {
    // it is possiible for a program to be empty (ie null)
    if(programs[j].name !== null) {
        logger.info("Add crontab[" + j + "]: " + programs[j].name + " // " + programs[j].crontab);

        // Used with node-sched
        job[j] = cronSched(programs[j]);
    }
}
// ---------------------------------------------------------------------------

var app = http.createServer(function (req, res) {
    // Get the url and associate the function to the handler
    // or
    // Trigger the 404
    handler  = urlMap[url.parse(req.url).pathname] || notFound;
    
    var json = "";
    
    if(req.method === "POST"){
        // We need to process the post but we need to wait until the request's body is
        // available to get the field/value pairs.
        req.body = '';
        
        req.addListener('data', function (chunk) {
            // Build the body from the chunks sent in the post.
            req.body = req.body + chunk;
        })
        .addListener('end', function () {
            json = JSON.stringify(qs.parse(req.body));
            handler(req, res, json);
        });
    } else {
        handler(req, res);
    }

    res.simpleJSON = function (code, obj) {
        var body = JSON.stringify(obj);
        res.writeHead(code, {
            "Content-Type": "text/json",
            "Content-Length": body.length
        } );
        res.end(body);
    };

    eventEmitter.emit('SrvReady');
}).listen(config.port, config.ip);

// ---------------------------------------------------------------------------
var ITEMS_BACKLOG = 20;

/*

The ITEMS_BACKLOG is the max number of items the server keeps in
memory, this way you can make sur it never runs out of memory, you’ll
see where it’s being used later.

I then declare my urlMap, these are the URLs the server listens to and
the code to execute upon calling. It’s fairly straight forward,
there’s one very important thing you need to know tho, it’s that since
node.js runs on a different port than your normal webserver (a
webserver usually runs on port 80), you need to forward the calls on
those URLs to your node.js server port.

*/
function load_index(req, res) {
    fs.readFile("ajax_irrigation.html", function(err, data) {
        if (err) {
            // Hmm, really need to put a 404 here
            logger.info("Error loading " + "index.html");
        } else {
            headers = {
                "Content-Type": "text/html" ,
                "Content-Length": data.length
            };

            headers["Cache-Control"] = "public";

            res.writeHead(200, headers);
            res.end(data);
        }
    });
}

//  various 'links' associated with this server
var urlMap = {
    // default
    '/' : function (req, res) {
        load_index(req, res);
    },

    '/index.html' : function (req, res) {
        load_index(req, res);
    },


    '/css/tabs.css' : function (req, res) {
        fs.readFile("css/tabs.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tabs.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/local-tabs.css' : function (req, res) {
        fs.readFile("css/local-tabs.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tabs.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/leds.css' : function (req, res) {
        fs.readFile("css/leds.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tabs.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/weather.css' : function (req, res) {
        fs.readFile("css/weather.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tabs.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/buttons.css' : function (req, res) {
        fs.readFile("css/buttons.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tabs.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/master.css' : function (req, res) {
        fs.readFile("css/master.css", function(err, data) {
            if (err) {
                logger.info("Error loading " + "master.css");
            } else {
                headers = { "Content-Type": "text/css" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/js/client.js' : function (req, res) {
        fs.readFile("js/client.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "client.js");
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/js/json2.js' : function (req, res) {
        fs.readFile("js/json2.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "json2.js");
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/js/led.js' : function (req, res) {
        fs.readFile("js/led.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "led.js");
                logger.info('Current directory: ' + process.cwd());
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/js/xmlHttp.js' : function (req, res) {
        fs.readFile("js/xmlHttp.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "xmlHttp.js");
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/js/miniclock.js' : function (req, res) {
        fs.readFile("js/miniclock.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "miniclock.js");
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/js/jquery.tools.min.js' : function (req, res) {
        fs.readFile("js/jquery.tools.min.js", function(err, data) {
            if (err) {
                logger.info("Error loading " + "json2.js");
            } else {
                headers = { "Content-Type": "text/javascript" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/click.ogg' : function (req, res) {
        fs.readFile("snd/click.ogg", function(err, data) {
            if (err) {
                logger.info("Error loading " + "json2.js");
            } else {
                headers = { "Content-Type": "audio/ogg" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    '/click.mp3' : function (req, res) {
        fs.readFile("snd/click.mp3", function(err, data) {
            if (err) {
                logger.info("Error loading " + "json2.js");
            } else {
                headers = { "Content-Type": "audio/mpeg" ,
                            "Content-Length": data.length };
                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        } );
    },

    // the socket.io library takes care of the /socket/socket.io.js so it's not needed here

    //  Added favicon
    '/favicon.ico' : function (req, res) {
        fs.readFile("favicon.ico", function(err, data) {
            if (err) {
                logger.info("Error loading " + "favicon.ico");
            } else {
                headers = {
                    "Content-Type": "image/x-icon" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/cross.png' : function (req, res) {
        fs.readFile("images/cross.png", function(err, data) {
            if (err) {
                logger.info("Error loading " + "cross.png");
            } else {
                headers = {
                    "Content-Type": "image/png" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/h150.png' : function (req, res) {
        fs.readFile("images/h150.png", function(err, data) {
            if (err) {
                logger.info("Error loading " + "h150.png");
            } else {
                headers = {
                    "Content-Type": "image/png" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/minus.gif' : function (req, res) {
        fs.readFile("images/minus.gif", function(err, data) {
            if (err) {
                logger.info("Error loading " + "minus.gif");
            } else {
                headers = {
                    "Content-Type": "image/gif" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/plus.gif' : function (req, res) {
        fs.readFile("images/plus.gif", function(err, data) {
            if (err) {
                logger.info("Error loading " + "plus.gif");
            } else {
                headers = {
                    "Content-Type": "image/gif",
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/textfield_key.png' : function (req, res) {
        fs.readFile("images/textfield_key.png", function(err, data) {
            if (err) {
                logger.info("Error loading " + "textfield_key.png");
            } else {
                headers = {
                    "Content-Type": "image/png",
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/images/tick.png' : function (req, res) {
        fs.readFile("images/tick.png", function(err, data) {
            if (err) {
                logger.info("Error loading " + "tick.png");
            } else {
                headers = {
                    "Content-Type": "image/png",
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    '/css/blue.png' : function (req, res) {
        fs.readFile("images/blue.png", function(err, data) {
            if (err) {
                logger.info("Error loading " + "blue.png");
            } else {
                headers = {
                    "Content-Type": "image/png" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    // ======================================================================
    // This only gets called by the client to to get current weather
    // ======================================================================
    '/data/wea-xml.sxml' : function (req, res) {
        fs.readFile("data/wea-xml.sxml", function(err, data) {
            if (err) {
                logger.info("Error loading " + "data/wea-xml.sxml");
            } else {
                headers = {
                    "Content-Type": "text/xml" ,
                    "Content-Length": data.length
                };

                headers["Cache-Control"] = "public";

                res.writeHead(200, headers);
                res.end(data);
            }
        });
    },

    /*
    ** ======================================================================
    ** XXX: I'm not really sure why this is here ??? I don't think we call this
    ** ======================================================================
    **
    ** undefined:1
    ** undefined
    ** ^
    ** SyntaxError: Unexpected token u
    **     at Object.parse (native)
    **     at urlMap./irrigation (/home/njc/dev/irrigation/irrnode/sched.js:1514:15)
    **     at Server.<anonymous> (/home/njc/dev/irrigation/irrnode/sched.js:1028:2)
    **     at Manager.handleRequest (/home/njc/dev/irrigation/irrnode/node_modules/socket.io/lib/manager.js:565:28)
    **     at Server.<anonymous> (/home/njc/dev/irrigation/irrnode/node_modules/socket.io/lib/manager.js:119:10)
    **     at Server.EventEmitter.emit (events.js:91:17)
    **     at HTTPParser.parser.onIncoming (http.js:1793:12)
    **     at HTTPParser.parserOnHeadersComplete [as onHeadersComplete] (http.js:111:23)
    **     at Socket.socket.ondata (http.js:1690:22)
    **     at TCP.onread (net.js:402:27)
    ** 
    ** [1]+  Exit 1                  node ./sched.js
    **  
    */
    '/irrigation' : function (req, response, json) {
        //
        // Okay this is what I want to do:
        // We get a request from the user, to turn on/off a irragation Zone.
        // We then tell the GPIO Pin to turn on/off and set a timer to turn
        // it off (if turned on) If on, we also send periodic updates with
        // the Pin's status until the in is turned off.
        //
        // var r = JSON.parse(json);
        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
        // JSON.parse parses a string as JSON and returns the parsed value.
        var r = JSON.parse(req.body);
        logger.info("irrigation: " + req.body);

        // This works fine
        // Assume r = { "z1": { "name": "Zone 1", ... }, "z2": { "name": "Zone 1", ... }, ... }
        // then r.z1 would be { "name": "Zone 1", ... }
        // and r.z1.name would be "Zone 1"
        logger.info("r: " + JSON.stringify(r));

        logger.info("Config.zones:" + JSON.stringify(config.status.zones));

        data = "Irrigation Done\n";

        headers = {
            "Content-Type": "text/plain" ,
            "Content-Length": data.length
        };

        headers["Cache-Control"] = "public";

        response.writeHead(200, headers);
        response.end(data);
    },

    /*
    ** ======================================================================
    ** XXX: I'm not really sure why this is here ??? I don't think we call this
    ** ======================================================================
    */
    '/status' : function (req, response, json) {
        var data = JSON.stringify(status);

        headers = {
            "Content-Type": "text/plain" ,
            "Content-Length": data.length,
            "Cache-Control" :"public"
        };

        response.writeHead(200, headers);
        response.end(data);
    } /* */
};
// ---------------------------------------------------------------------------

logger.info(Date().toString());
monitor();
// -[ fini ]------------------------------------------------------------------
