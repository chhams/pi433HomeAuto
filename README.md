pi433HomeAuto
=============

Software to control 433MHz mains switches using a Raspberry Pi

Why another home automation system for Raspberry Pi?
====================================================
There are lots out there already - some are quite hacky with wires branching out to breadboards or
Arduinos, some are neatly done but took strange decisions that require databases to be setup on the Pi
to store details of which switches etc to be used. 

This code is an attempt at a light-weight & no database solution for 433Mhz switches, currently only 
supporting the "two rotary dials" type switches but it would be very easily to extend to other 
types.  The hardware required for this can be easily hidden away in a plain Raspberry Pi box, and 
the software is based off of NodeJS for low-resource consumption.  The access & authentication is 
handled by Google's federated login, and the basic and largely non-volatile settings are just stored 
in settings.js.  Simples.

Current screenshot of the web interface as of September 2013:

![Image](../master/screenshot.png?raw=true)



Requirements
============

Hardware
--------
Apart from some 433MHz remote switches you will need some sort of 433MHz RF Link Transmitter 
connected to your Pi, with 4 female-female jumper leads to connect from your Pi to the ground, 
data, voltage and antenna pins on the transmitter.

How you hook your transmitter up to your Pi will vary depending on what transmitter you get (the
one I got was Pin 1:ground, 2:data, 3:vcc, 4:antenna), but for mine I did it like this: 

(Tx -> Pi)  
1 -> 6  
2 -> 11  
3 -> 2  
4 -> None!  

I managed to get the transmitter and the jumper cables to fit inside a fairly normal Raspberry Pi
case which makes for a very neat installation!

Software
--------
You'll need to install the following software items before starting:

* WiringPi
* NodeJS
* rcswitch-pi

The easiest way of doing this to run the following - this may take an hour or two to complete on a
Pi though!

Make sure your packages are up to date first  
`sudo apt-get update`  
`sudo apt-get upgrade`  
`sudo apt-get install git-core python g++ make checkinstall`  

Download and compile WiringPi  
`git clone git://git.drogon.net/wiringPi`  
`cd wiringPi`  
`./build`  
`cd ..`  

Download and compile rcswitch-pi  
`https://github.com/denschu/rcswitch-pi`  
`cd rcswitch-pi`  
`make`  
`cd ..`  

Download and compile NodeJS (the long one!  Expect 1.5 to 2 hours.)  
`mkdir ~/src && cd $_`  
`wget -N http://nodejs.org/dist/node-latest.tar.gz`  
`tar xzvf node-latest.tar.gz && cd node-v*`  
`./configure`  
`checkinstall #(remove the "v" in front of the version number in the dialog)`  
`sudo dpkg -i node_*`  

Note if you get compilation errors from NodeJS along the lines of "For thumb inter-working we 
require an architecture which supports blx" then I edited the src/node-v*/deps/v8/src/arm/macro-assembler-arm.cc file and removed the lines, saved, and then re-ran `checkinstall`:

`defined(USE_THUMB_INTERWORK) && !defined(CAN_USE_THUMB_INSTRUCTIONS)`  
`  error 'For thumb inter-working we require an architecture which supports blx'`  
`endif`  

Once you've got node running you just need to finally install the following node modules: 
 
`npm install express passport ejs connect-flash passport-google`

Set up
======
When setting up the software, make sure you edit settings.js to reflect your needs.  Please
make sure you add in your primary Google account's email address into the list of authorised users
or you wont be able to log in!

Also, in switches.js you might need to fiddle with the codes sent to the switches as it seems that
for some switches the "On" and "Off" codes can be "FF" and "F0", or "0F" and "00" - some people with 
the same model of plugs get different results, so worth a try if things aren't working.

Once you're setup, run the app with `node app.js` and go to the URL you specified in
settings.js, login, and you're ready to go.

License
=======
MIT License - please see LICENSE for full details.