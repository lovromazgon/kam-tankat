# Kam tankat?!
A simple application for calculating the savings if you buy fuel in Austria instead of in Slovenia.

##How to build it?
You need [Babel](https://babeljs.io/) to compile the JavaScript source, because it is written in ECMAScript 6, which is not (yet) supported by browsers.

##Why do you have server scripts?
The requests must go through a proxy server, where the PHP scripts are executed, because the webservices for fuel prices don't have [CORS](http://enable-cors.org/) enabled and the browser won't allow direct requests to them. If anyone knows how to bypass this problem without server scripts, that would be great :)
