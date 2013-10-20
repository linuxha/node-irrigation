## irrnode
Irrnode is an irrigation control server used to control digital IO such as direct
IO on a Raspberry Pi or remote IO such as on an Elexol Ether IO24 board (via UDP).
This IO is then connected to sprinkler head valves. The program allows the user to
provide 'program' which run the valves in the specified order and for the specified
time.  External conditions can be added to allow/defer running a 'program'.

Irrnode provides a web interface to monitor, control and configure the irrigation
system.

Zone status information
Run/Stop switch
Status

Current weather report, sun rise, sun set and phase of the moon
and day's weather forecast

## Objective

My motivation is two-fold. First is to replace the ancient irrigation control we
currently have. The second was to learn node.js & asynchronous (event) based
programming.

I plan to use a Raspberry Pi and it's built in IO but I built this on a server
running Linux and external IO (the Elexol Ether IO board). One of the features
I want is a web interface and access to external information to allow certain
conditions to be met to allow the schedule to run. Another is the use of cron
like schedule syntax for flexibility. 

## Usage
```JavaScript
node node-irrigation.js
```

## Version

0.1 Beta (hey, I'm still working here ;-) )

## TODO

Well currently the only way to configure this program is to create the *.json files
used by irrnode.js. So I really need to document the files to be configured (and what's
needed). Also it would be nice to provide a web interface that would permit my wife
(who doesn't want to know how to program to use the program) to be able to use this
program.

- [x] Add daemon so this program can be started without a tty
- [x] Add syslog messaging so we can keep track of what irrnode is doing
- [ ] Add better status information handling to the browser (that way everything won't need to be sent to the syslog.
- [ ] Add signal handling so we can change the debug level (I may want to consider adding this as a event sent from the bowser 
- [ ] User interface (currently you have to edit json files to configure the program)
- [ ] External conditions
- [ ] Move device interface outside of the main node-irrigation.js file
- [ ] Provide device other interfaces (current uses the Elexol Ether IO board)
- [ ] Need the initialization routine setup for the Elexol Ether IO board
- [ ] device heartbeat (optional)
- [ ] Documentation, at this moment the documentation is rather weak.

## Notes

Currently I have irrnode setup to use the 24 port Elexol Ether IO board. This board is
a bit expensive for such a setup. I'll eventually create a new driver for the direct IO
on the Raspberry Pi.

## Installation

The following files are used by irrnode.js.

extCnds.json - external conditions, such as temperature = 76. This comes from an external program such as a weather station daemon. Currently not being used

fauxStatus.json - Not needed (used for testing, will be deleted soon)

irrigation.json - Default settings and port descriptions for the irrigation program 

    "port":    8022,
    "ip":      "0.0.0.0",
    "version": "2.0",

    "uid":     "njc",
    "gid":     "users",

    "zones":[
    {
        "name":  "Zone 1",
        "zone":  "1",
        "port":  "A",
        "pin" :  "0",
        "state": ""
    },

programs.json - provides the device mapping (here port and pon) to the Irrigation systems zones. Also provides the run times and the time to start in crontab format

    {
	"name" : "Program 0",
	"comment" :"m h dom mon dow command",
	"crontab" : "*/10 * * * *",
	"conditions" : [
	    ""
	],
	"steps" : [
	    { "port" : "B", "pin" : 0, "zone" :  9, "time" : "2500"},
	    { "port" : "B", "pin" : 1, "zone" : 10, "time" : "2500"},
	    { "port" : "B", "pin" : 2, "zone" : 11, "time" : "2500"},
	    { "port" : "B", "pin" : 3, "zone" : 12, "time" : "2500"},
	    { "port" : "B", "pin" : 4, "zone" : 13, "time" : "2500"},
	    { "port" : "B", "pin" : 5, "zone" : 14, "time" : "2500"},
	    { "port" : "B", "pin" : 6, "zone" : 15, "time" : "2500"},
	    { "port" : "B", "pin" : 7, "zone" : 16, "time" : "2500"}
	]
    },

wea-xml.sxml - used by the index.html to pull back weather information related to this location. This information can be pulled back by an external cron job (need to provide the script as an example).

## Dependencies

### System builtins
http
sys
url
querystring
fs
events
tls
dgram

### 3rd Party
socket.io
usage
syslog
daemon
// Device (not moved out of the main node-irrigation.js yet)
node-schedule

## Tests

## Contributors & Credits

## License
GPLv2

## References

http://www.elexol.com
http://www.elexol.com/IO_Modules/Ether_IO_24.php
http://www.elexol.com/IO_Modules/USB_IO_24.php
http://www.cainetworks.com/products/webcontrol/index.html
http://www.raspberrypi.org/
