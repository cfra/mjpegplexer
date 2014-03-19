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

var cam = 0;
var camHost = "192.168.1.20:8080";
var controlHost = "192.168.1.20:8080";
var submitHost = "192.168.1.20:8080";
var formActive = 0; //crazy errors if boolean is used here...

//create event which is triggered when DOM is ready 
window.onDomReady = initReady;

//change from testbild to default cam when DOM is ready
window.onDomReady(initViewer);


function initReady(fn)	{
	if(document.addEventListener) {
		document.addEventListener("DOMContentLoaded", fn, false);
	}
}

//hide the form, and switch on camera
function initViewer()	{
	var display = document.getElementById('screen');
	var tempCam = parseInt(localStorage.getItem('cam'));

	formActive = localStorage.getItem("formActive");
	if (tempCam <= 7 && tempCam >= 0) {
		cam = tempCam;
	}	
	
	//if form was displayed, when page was reloaded, display form
	if (formActive == 1)	{
		displayCamNumber();
		display.innerHTML += '<img id="camImage" src="http://' + camHost + '/cam/' + cam + '/stream.mjpeg" />';
		showForm();
	}
	else	{
		formActive == 0;
		document.getElementById('form').style.visibility = "hidden";
		changeCam();
	}
}

function displayCamNumber()	{
	var display = document.getElementById('screen');
	camDisplay = cam + 1;
	display.innerHTML = '<p class="camNumber">' + camDisplay + '</p>';
}

//change currently displayed camera to the one in cam variable
function changeCam()	{
	
	var display = document.getElementById('screen');
	if (cam <= 7 && cam >= 0)	{
			displayCamNumber();
			display.innerHTML += '<img id="camImage" src="http://' + camHost + '/cam/' + cam + '/stream.mjpeg" />';
			localStorage.setItem("cam", cam);
	}
	else	{
			display.innerHTML = '<img id="camImage" src="img/testbild.gif" />';
	}
}

//send control command to currently selected camera
function controlCam(direction)	{
	if (direction == "left" || direction == "right" || direction == "up" || direction == "down")	{
		var request = new XMLHttpRequest();
		request.open("get", "http://" + controlHost + "/cam/" + cam + "/control/" + direction, false);
		request.send();
		return false;
	}
}

//save current screenshot in local storage
function saveImage()	{
	
	var storageFiles = {}, 			//local storage object
	    xhr = new XMLHttpRequest(),
	    blob,
	    fileReader = new FileReader(),
	    snapShot = new Image(),		//dummy-object to display snapshot
	    imgCanvas = document.createElement("canvas"), 
	    imgContext = imgCanvas.getContext("2d");


	//xhr.open("GET", 'img/testbild-' + camDisplay + '.png', true);
	xhr.open("GET", 'http://' + camHost + '/cam/' + cam + '/snapshot.jpg', true);
	xhr.responseType = "arraybuffer";
	
	xhr.addEventListener("load", function () {
		if (xhr.status === 200) {
			
			blob = new Blob([xhr.response], {type: "image/jpg"});
		
	
			fileReader.onload = function (evt) {	
	        	        var result = evt.target.result;
			
				snapShot.src = result;
	        	        
	        	        try {
	        	            localStorage.setItem("snapShot", result);
				    localStorage.setItem("timeStamp",
					   	 strftime('%Y-%m-%d_%H-%M-%S'));
	        	        }
	        	        catch (e) {
	        	            console.log("Storage failed: " + e);
	        	        }
			};
			
			fileReader.readAsDataURL(blob);
			
			fileReader.onloadend = function()	{
				showForm();
			}
		}
	}, false);

	xhr.send();
}

function showForm()	{

	//load snapshot from localstorage
	var display1 = document.getElementById("camImage"),
	    stor = localStorage.getItem("snapShot");
	    timestamp = localStorage.getItem("timeStamp");

	//display loaded image
	if (stor)       {
		display1.setAttribute("src", stor);
	}

	//insert date in date-field
	document.getElementById("formDate").value = timestamp;

	//make form visible
	document.getElementById("form").style.visibility = 'visible';
	document.getElementById("printButton").onclick = completeForm;
	formActive = 1;
	localStorage.setItem("formActive", formActive);
}

var errorTimeout = null;
function setError(message) {
	var error_box = document.getElementById('errorBox');
	error_box.innerText = message;
	if (errorTimeout !== null)
		window.clearTimeout(errorTimeout);
	errorTimeout = window.setTimeout(function() {
		error_box.innerHTML = '&nbsp;';
		errorTimeout = null;
	}, 5000);
	return false;
}


function completeForm()	{
	var formName = document.getElementById('formName');
	var formDate = document.getElementById('formDate');
	var formAnalysis1 = document.getElementById('formAnalysis1');
	var formAnalysis2 = document.getElementById('formAnalysis2');
	var formAnalysis3 = document.getElementById('formAnalysis3');

	if (formName.value.length < 3)
		return setError("Personalkennzeichung unzureichend!");
	if (formAnalysis1.value.length < 3)
		return setError("Analyse der Aufnahme unzureichend!");
	if (formAnalysis2.value.length < 3)
		return setError("Bemerkungen zum Untersuchungsverlauf unzureichend!");
/*	if (formAnalysis3.value.length < 3)
		return setError("Analyse der Aufnahme unzureichend!");*/

	// unfocus and disable button
	//otherwise next enter press will trigger print-function
	document.getElementById('printButton').blur();
	document.getElementById('printButton').onclick = function() {
		return false;
	};

	var request = new XMLHttpRequest();
	request.open("post", "http://" + submitHost + "/submit", false);

	var post_object = {
		'cam': localStorage.getItem("cam"),
		'formName': formName.value,
		'formDate': formDate.value,
		'formAnalysis1': formAnalysis1.value,
		'formAnalysis2': formAnalysis2.value,
		'formAnalysis3': formAnalysis3.value,
		'formImage': localStorage.getItem("snapShot")
	};

	var post_data = JSON.stringify(post_object);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(post_data);

	// clear the input fields so they are not
	// visible during next usage of the form.
	// XXX: Leave the name in?
	document.getElementById('formName').value = '';
	document.getElementById('formAnalysis1').value = '';
	document.getElementById('formAnalysis2').value = '';
	document.getElementById('formAnalysis3').value = '';

	//hide form and unfocus button
	//otherwise next enter press will trigger print-function
	document.getElementById("form").style.visibility = 'hidden';
	formActive = 0;
	localStorage.setItem("formActive", formActive);
	changeCam();
	return false;
}


function keyDown(event)	{

	// chaning the camera is only possible if the form is not displayed
	if (formActive != 1) {
		//numpad has different keycodes!
		switch(event.keyCode)	{
			case 49: // 1
				cam =  0;
				changeCam();
				break;
			case 50: // 2
				cam =  1;
				changeCam();
				break;
			case 51: // 3
				cam =  2;
				changeCam();
				break;
			case 52: // 4
				cam =  3;
				changeCam();
				break;
			case 53: // 5
				cam =  4;
				changeCam();
				break;
			case 54: // 6
				cam =  5;
				changeCam();
				break;
			case 55: // 7
				cam =  6;
				changeCam();
				break;
			case 56: // 8
				cam =  7;
				changeCam();
				break;
			case 37: // arrow left
				controlCam("left");
				break;
			case 38: // arrow up
				controlCam("up");
				break;
			case 39: // arrow right
				controlCam("right");
				break;
			case 40: // arrow down
				controlCam("down");
				break;
			case 13: //enter
				saveImage();
				break;
		}	
	}
}
