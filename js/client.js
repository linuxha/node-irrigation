// ---------------------------------------------------------------------------

/*

Deliver real-time information to your users using node.js
=========================================================
July 26th 2010

You must have already heard about node.js, if not, it's an evented
input/output server based on Google V8 engine. That means that as soon
as the server receives information it can respond and send relevant
information back to your front-end. You can then treat this
information the way you want. What is so cool about it is that if you
know javascript you can code a node.js server and it really is a lot
of fun!

In this article, I'll cover the basics to be able to build a simple
server that will respond to an 'admin' user input and then broadcast a
message to all users connected on the website. Based on that, you're
then free to apply it to whatever needs you may have.

Please note that some basic server knowledge is required, like
installing software with command line and forward requests to specific
ports.

The demo
--------

First open the live feed demo page, then open the live feed admin
page. Try to resize them so you can see both, then click on the
display buttons on the admin page, watch the magic happen on the live
feed page!  The basics

How does that real-time thing work? Well it's actually quite
simple. Every time a user connects to my demo page, I open an ajax
connection, that ajax connection wait for the server to send
data. Once it receives data, it's processed, the connection is closed
and a new one is opened. This can be called Comet, long polling, ajax
push, HTTP Streaming and a bunch of other names. You can also do
long-polling in PHP but since node.js is a dedicated server it does a
better job at handling the load.

The client
----------

What you need to do on the client side is very simple, you only need
to start an ajax call that restarts when it receive a response:

*/
// ajax stuff :-)
function longPoll_feed () {
    // make another request
    $.ajax({
        cache    : false,
        dataType : 'json',
        type     : "GET",
        url      : "/real_time_feed",
        error    : function () {
            // console.log("Error, set timeout longPoll_Feed");
            // don't flood the servers on error, wait 10 seconds before retrying
            setTimeout(longPoll_feed, 10*1000);
        },
        success  : function (json) {
            // We've been seeing null objects, I don't know why but we can
            // ignore them
            if(json !== null) {
                display_event(json);
                // console.log("LongPoll_feed()");
            }
            // if everything went well, begin another request immediately
            // the server will take a long time to respond
            // how long? well, it will wait until there is another message
            // and then it will return it to us and close the connection.
            // since the connection is closed when we get data, we longPoll
            // again
            longPoll_feed();
        }
    });
}

// ---------------------------------------------------------------------------

/*

So that ajax call listens to what is sent on the '/real_time_feed'
url. Once it receives data, it processes them.

Since it's JSON that is returned to my views, I can then treat it the
way I want. This file need to be included in the HTML file that will
receive the live content.

*/

//
var MAX_DUMP_DEPTH = 10;

function dumpObj(obj, name, indent, depth) {
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
        return obj;
    }
}

// http://my.opera.com/GreyWyvern/blog/show.dml/1725165
//
// This isn't really needed here but was left here so I can find it should I
// need it. One thing, the Google APIs don't like you messing about with the
// Object object. So be careful using this.
//
// Clone an object, doesn't work for all objects
//Object.prototype.myClone = function() {
function myClone(t) {
  var newObj = (t instanceof Array) ? [] : {};
  for (var i in t) {
    if (i == 'clone') continue;
    if (t[i] && typeof t[i] == "object") {
      newObj[i] = t[i].clone();
    } else { 
      newObj[i] = t[i];
    }
  } return newObj;
}
       
// Descision maker
// 
/*

Okay I've done a bunch of cleaning up of this code and I've made quite a mess


*/
function display_event(json) {
    $('#feed_holder').prepend('<hr/>');

    try {
        switch(json[0].type) {

        /*
          An alarm is made up of the:

          type: 'alarm'
          severity: x (where x = info, minor, warning, major or critical)
          content: 'blah blah blah ....'
        */
        case 'alarm':
            /*
            ** <p><div class="severity">Message</div></p>
            */
            console.log("received alarm");
            severity = '<div class="' + json[0].severity + '">';
            $('#feed_holder').prepend('<p>' + severity + json[0].content+'</div></p>');
            break;
            
        case 'message':
            console.log("received message");
            $('#feed_holder').prepend('<p>'+json[0].content+'</p>');
            break;
            
        case 'google_map':
            console.log("received google_map");

            try {
                /*
                **  JSON data:
                **
                **  {
                **    type: 'google_map',
                **    content: {
                **      lat: '37.331693',
                **      lon: '-122.0307642'
                **    }
                **  }
                **
                **  Results in Web console (JS debugger):
                **  [04:09:07.981] Problem with Google Maps, json[0].content is undefined
                **  >  json[0]
                **  >   0
                **  >           type: google_map
                **  >           content[lat]: 37.331693
                **  >           content[lon]: -122.0307642            @ http://192.168.24.2:8001/js/client.js:154
                **
                ** I've not solved this, what I have done is worked around this with:
                **  >           lat: 37.331693
                **  >           lon: -122.0307642            @ http://192.168.24.2:8001/js/client.js:154
                **
                ** I just can't seem to access json[0].content, it's null but the
                ** dumpObj function can reach it.
                **
                ** Further info, I created a web page with the above JSON code
                ** assigned to arr[0]. That doesn't have a problem accessing
                ** the JSON code (json[0].content.lat specifically). So it must
                ** be the method of delivery that's messing this up. It works
                ** directly in the web page example, js & smjs.
                */

                // This one fails because json[0].content is undefined
                myLatlng = new google.maps.LatLng(json[0].lat, json[0].lon);

                //console.log("Dump json[0], " + dumpObj(json[0], "json[0]", ">  ", 5) );
                // this works okay
                //myLatlng = new google.maps.LatLng(40.375746, -74.379641);
            } catch(err) {
                console.log("Problem with json[0], " + err.message + "\n" + dumpObj(json[0],         "json[0]", ">  ", 5));
                break;
            }

            myOptions = {
                zoom     : 15,
                center   : myLatlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            
            $('#feed_holder').prepend('<div class="map" style="width:300px;height:300px;"></div>');
            
            map = new google.maps.Map($('.map:first')[0], myOptions);
            break;
            
        case 'youtube':
            console.log("received youtube");
            try {
                // video_id = json[0].content.url;
                video_id = json[0].url;
                video_id = video_id.substring(video_id.indexOf('?v=')+3,video_id.length);

                // This didn't prepend to the feed_holder element, it overwrote
                // it (???)
                $('#feed_holder').prepend('<object width="575" height="385"><param name="movie" value="http://www.youtube.com/v/'+video_id+'&amp;hl=en_US&amp;fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'+video_id+'&amp;hl=en_US&amp;fs=1" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="575" height="385"></embed></object>');
            } catch(err) {
                console.log("Problem with Youtube, " + err.message);

                break;
            }
            break;

        case 'tweet':           // Send a post to Twitter
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;

        case 'post':            // Send a post to Facebook
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;

        case 'go':              // Send a post to Facebook
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;

        case 'twitter':         // Get a post from Twitter
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;

        case 'facebook':        // Get a post from facebook
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;

        case 'google+':         // Get a post from Google+
            console.log("received alarm");
            // User =
            // Password =
            // tweet =
            // twitter(l, p, t);
            break;


        default:
            console.log("Received other");
            // Okay this goofiness is so I can use curl to post strings (won't post JSON :-/ )
            var str;

            var arr = []; // new Array();
            console.log("o: " + typeof json + "\n" + dumpObj(json, "json", ">  ", 5));

            if (typeof json == "object") {
                var x = 0;
                for (var item in json[0]) {
                    arr[x++] = item;
                    console.log("  item[" + x + "]: " + item );
                }

                str = arr[0];
            } else {
                str = json;
            }

            console.log("str: " + str );
            //var o = JSON.parse(json[0]);
            // Danger Will Robinson, Danger!

            var o = eval( '(' + str + ')' );
            console.log("o: " + typeof o + "\n" + dumpObj(o, "o", ">  ", 5));
            arr[0] = o;
            display_event(arr);
            break;
        } // end switch

    } catch(err) {
        console.log("Problem with Switch, " + err.message);
    }
}

function testResults(form) {
    //begin listening for updates right away
    longPoll_feed();
}

$(document).ready(function() {
    //begin listening for updates right away
    longPoll_feed();
});
/*

The big merge

Ok so now you have your server javascript file and your client
javascript file. The first thing you need to do is create an HTML page
in which you'll include the client.js file, I my case, it's the
index.html file.

Now for the server.js file, you actually need to connect via command
line and start the node.js server like so:

  [scaron]$ node /path/to/server.js
  Server running at http://127.0.0.1:8001/

And finally, to be able to send content to the server in real time,
you need to POST content to the url '/send_feed_item'
in my URL map, I have setup this url to append content to my feed. So
a simple ajax post should do the trick to post content, that's what I
do in my admin page.

$.post(
  'http://nodejs.no-margin-for-errors.com/send_feed_item',
   json,
  function(){
     // Done!
  }
);

The sources: http://github.com/scaron/node.js-demo

All the sources are available on github, feel free to fork them and
play with it yourself.  The possibilities

Let's just say you watch a live conference on ustream.tv and the
speaker mention some website, with node.js he could be able to send
you to this website in real time as long as you are connected to his
server or you could be watching live news on a website and they
mention traffic, you could then be presented a Google traffic map live
as they talk about it on the stream.

The possibilites are endless, this post covers only the basics, I'll
let your mind do the rest ;)

*/