// CCTV Control 
// 
// Author: 	Florian Raemisch
// Email: 	olf@subsignal.org
//
// cctv-control is a webinterface to control and view 
// mjpeg encoded videos by cctv cameras which are
// proxied by mjpegplexer. camera control is possible
// with arrow-keys, if mjpegplexer is configured 
// properly.
//
// This Software is licensed under the GPL Version 3, 29 June 2007

var popen = '<p id="text">',
    pclose = '</p>';

//create event which is triggered when DOM is ready 
window.onDomReady = initReady;

//change from testbild to default cam when DOM is ready
window.onDomReady(initViewer);


function initReady(fn)	{
	if(document.addEventListener) {
		document.addEventListener("DOMContentLoaded", fn, false);
	}
}

function initViewer()	{

	//load contents from localStorage
	var display = document.getElementById("camImage"),
	    meta = document.getElementById("metaContainer"),
	    text = document.getElementById("textContainer"),
            formName = localStorage.getItem("formName"),
	    formDate = localStorage.getItem("formDate"),
	    formAnalysis1 = localStorage.getItem("formAnalysis1"),
	    formAnalysis2 = localStorage.getItem("formAnalysis2"),
            formAnalysis3 = localStorage.getItem("formAnalysis3"),
	    camera = localStorage.getItem("cam");
	    stor = localStorage.getItem("snapShot");

	//cameraname is cameraID + 1
	camera = parseInt(camera) + 1;

	//display loaded data
        if (stor)       {
                display.setAttribute("src", stor);
        	meta.innerHTML += popen + formName + pclose;
        	meta.innerHTML += popen + formDate + pclose;
        	meta.innerHTML += popen + 'Kamera ' + camera + pclose;
        	text.innerHTML += popen + formAnalysis1 + pclose;
        	text.innerHTML += popen + formAnalysis2 + pclose;
        	text.innerHTML += popen + formAnalysis3 + pclose;
        }

	//commented out for debugging and layouting purposes
	print();

	//reset localStorage to default values
	//localStorage.setItem("formName", "Untersucher");
	//localStorage.setItem("formDate", "Datum");
	//localStorage.setItem("formAnalysis1", "Dein Bericht 1");
	//localStorage.setItem("formAnalysis2", "Dein Bericht 2");
	//localStorage.setItem("formAnalysis3", "Dein Bericht 3"):

	//commented out for debugging and layouting purposes
	window.close();

}

