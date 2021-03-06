'use strict';

var express = require('express');
var fs = require('fs');
var http = require('http');
var url_module = require('url');
var child_process = require('child_process');

var MjpegProxy = require('mjpeg-proxy').MjpegProxy;

var app = express();
app.use(express.json());

var storage_dir = '/home/untersuchung/storage';

var cameras = [
	{
		baseurl: 'http://192.168.1.20:8080/cam/0',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/1',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/2',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/3',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/4',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/5',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/6',
		model: 'mjpegplexer'
	},
	{
		baseurl: 'http://192.168.1.20:8080/cam/7',
		model: 'mjpegplexer'
	},
];

var still_frames = [
	fs.readFileSync(__dirname + '/noise.jpg'),
	fs.readFileSync(__dirname + '/noise2.jpg'),
];

function SimpleProxy(url) {
	var self = this;

	self.url = url;
	self.handle_request = function(req, res) {
		var request_options = url_module.parse(self.url);
		request_options.agent = false;
		var proxy = http.request(request_options, function(proxy_res) {
			proxy_res.on('data', function(chunk) {
				res.write(chunk, 'binary');
			});
			proxy_res.on('end', function() {
				res.end();
			});
			res.writeHead(proxy_res.statusCode,
					proxy_res.headers);
		});
		proxy.on('error', function(err) {
			console.log("Simple proxy " + self.url + " failed:");
			console.log(err);
			res.end();
		});
		req.on('data', function(chunk) {
			proxy.write(chunk, 'binary');
		});
		req.on('end', function() {
			proxy.end();
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
		urls.snapshot = camera.baseurl + '/snapshot.jpg';
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
	app.use('/interface',
			express.static(__dirname + '/public'));

app.get('/blackout', function(req, res) {
	for (var camera_idx in cameras) {
		var camera = cameras[camera_idx];

		camera.proxy.on_air = !camera.proxy.on_air;
	}
	res.send('OK');
});

/* receives the form from the user */
app.post('/submit', function(req, res) {
	var timestamp = req.body.formDate;
	var path = storage_dir + '/' + timestamp;
	fs.mkdirSync(path);

	/* Save the image to disk */
	/* XXX: here be dragons */
	var image = req.body.formImage;
	var regex = /^data:.+?\/.+?;base64,(.*?)$/;
	var matches = image.match(regex);
	var base_data = matches[1];
	var buffer = new Buffer(base_data, 'base64');
	fs.writeFileSync(path + '/snapshot.jpg', buffer);

	req.body.formImage = undefined;
	var info = JSON.stringify(req.body);
	fs.writeFileSync(path + '/info.json', info);

	child_process.spawn(__dirname + '/preprint/run.py', [path], {
		detached: true,
		stdio: 'inherit'
	});
	res.send('OK');
});

app.listen(8080);
