var express = require('express');
var fs = require('fs');
var MjpegProxy = require('mjpeg-proxy').MjpegProxy;

var app = express();

var cameras = [
	{
		url: 'http://admin:123456@192.168.0.117/videostream.cgi?rate=1'
	},
	{
		url: 'http://admin:123456@192.168.0.178/videostream.cgi?rate=1'
	}
];

var still_frames = [
	fs.readFileSync(__dirname + '/noise.jpg'),
	fs.readFileSync(__dirname + '/noise2.jpg'),
];

for (var camera_idx in cameras) {
	var camera = cameras[camera_idx];
	camera.proxy = new MjpegProxy(camera.url, still_frames)
	app.get('/cam/' + camera_idx + '/stream.mjpeg', camera.proxy.proxyRequest);
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
