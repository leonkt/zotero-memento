

function constructURI(uri) {
	return "https://web.archive.org/save/" + uri;
}


function push(uri) {
	const request = require('request');
	const init = {
		method: 'GET',
		uri: "https://int.lanl.gov/"
	};
	request(init, function(error, response, body) {
		console.error(error);
		console.log(response && response.statusCode);
		console.log(body);
	});
}

push("https://www.w3schools.com/");