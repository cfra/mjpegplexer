function reloadSrc() {
	var camImage = document.getElementById('cam');
	if (camImage)
		camImage.setAttribute('src', camImage.getAttribute('src'));
	window.setTimeout(reloadSrc, 5000);
}

reloadSrc();
