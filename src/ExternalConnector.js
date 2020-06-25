import Response from './Response.js';

export default class ExternalConnector{
	static getInstance(){
		if(!ExternalConnector.instance)
			ExternalConnector.instance = new ExternalConnector();
		return ExternalConnector.instance;
	}

	dataObjectToString(data){
		let parametersString = '';

		if(!(data instanceof FormData)){
			data = Object.entries(data);
		}

		for (let [key, value] of data) {
			if(key)
				parametersString += `${key}=${value.toString().trim()}&`;
		}
		parametersString = parametersString.slice(0, -1);

		return parametersString;
	}

	doRequest(request){
		return new Promise(function(resolve, reject) {
			let xhttp = new XMLHttpRequest();
			let url = encodeURI(request.uri);
			if(request.method == 'get' && request.getData() != null){
				url += '?' + this.dataObjectToString(request.getData());
			}
			xhttp.open(request.getMethod(), url, true);
			for(let header of request.getHeaders())
				xhttp.setRequestHeader(header.name, header.value);
			xhttp.responseType = request.getResponseType();
			let timeout = request.getTimeout();
			if(timeout)
				xhttp.timeout = timeout;
			xhttp.onreadystatechange = async function(){
				let res = new Response();
				if(xhttp.readyState === XMLHttpRequest.DONE){
					let response = xhttp.response;
					res.code = 0;
					res.status = xhttp.status;
					if(xhttp.status !== 200) {
						res.code = -10;
						res.content = {
							'error':'Request error',
							'httpStatus': xhttp.status,
							'serverResponse': response
						};
					}else if(response){
						res.content = response;
					}else{
						res.code = -11;
						res.content = {
							'error':'No data response',
							'httpStatus': xhttp.status
						};
					}

					if(res.code==0)
						resolve(res);
					else
						reject(res);
				}
			};
			xhttp.send(request.getData());
		}.bind(this));
	}
};
ExternalConnector.instance = null;