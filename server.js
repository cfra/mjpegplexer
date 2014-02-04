'use strict';

var express = require('express');
var fs = require('fs');
var request = require('request');
var MjpegProxy = require('mjpeg-proxy').MjpegProxy;

var app = express();

var cameras = [
	{
		baseurl: 'http://admin:123456@192.168.1.10',
		model: 'conceptronic'
	},
	{
		baseurl: 'http://admin:123456@192.168.1.11',
		model: 'conceptronic'
	},
	{
		baseurl: 'http://admin:123456@192.168.1.12',
		model: 'conceptronic'
	}
];

var still_frames = [
	fs.readFileSync(__dirname + '/noise.jpg'),
	fs.readFileSync(__dirname + '/noise2.jpg'),
];

function SimpleProxy(url) {
	var self = this;

	self.url = url;
	self.handle_request = function(req, res) {
		request(self.url, function(err, response, body) {
			if (err) {
				console.log("Simple proxy " + self.url + " failed.");
				console.log(err);
				res.end();
				return;
			}
			res.write(body);
			res.end();
		});
	};
}

for (var camera_idx in cameras) {
	var camera = cameras[camera_idx];
	var urls = {};

	if (camera.model == 'conceptronic') {
		urls.mjpeg = camera.baseurl + '/videostream.cgi?rate=1';
		urls.down = camera.baseurl
			  + '/decoder_control.cgi?onestep=1&command=0';
		urls.up = camera.baseurl
			+ '/decoder_control.cgi?onestep=1&command=2';
		urls.right = camera.baseurl
			   + '/decoder_control.cgi?onestep=1&command=4';
		urls.left = camera.baseurl
			  + '/decoder_control.cgi?onestep=1&command=6';
		urls.snapshot = camera.baseurl + '/snapshot.cgi';
	} else if (camera.model == 'mjpegplexer') {
		urls.mjpeg = camera.baseurl + '/stream.mjpeg';
		urls.down = camera.baseurl + '/control/down';
		urls.up = camera.baseurl + '/control/up';
		urls.right = camera.baseurl + '/control/right';
		urls.left = camera.baseurl + '/control/left';
		urls.snapshow = camera.baseurl + '/snapshot.jpg';
	};

	camera.proxy = new MjpegProxy(urls.mjpeg, still_frames);
	app.get('/cam/' + camera_idx + '/stream.mjpeg', camera.proxy.proxyRequest);
	for (var url in urls) {
		if (url == 'mjpeg' || url == 'snapshot')
			continue;
		app.get('/cam/' + camera_idx + '/control/' + url,
				new SimpleProxy(urls[url]).handle_request);
	}
	app.get('/cam/' + camera_idx + '/snapshot.jpg',
			new SimpleProxy(urls.snapshot).handle_request);
	app.use('/cam/' + camera_idx + '/browse',
			express.static(__dirname + '/cam_public'));
}

app.get('/blackout', function(req, res) {
	for (var camera_idx in cameras) {
		var camera = cameras[camera_idx];

		camera.proxy.on_air = !camera.proxy.on_air;
	}
	res.send('OK');
});


app.listen(8080);
