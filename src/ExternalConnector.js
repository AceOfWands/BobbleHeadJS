import Response from './Response.js';
import Cacher from './Cacher.js';

export default class ExternalConnector{
	static getInstance(){
		if(!ExternalConnector.instance)
			ExternalConnector.instance = new ExternalConnector();
		return ExternalConnector.instance;
	}
	doRequest(request){
		return new Promise(function(resolve, reject) {
			var xhttp = new XMLHttpRequest();
			var url = encodeURI(request.uri);
			if(request.method == 'get' && request.getData() != null){
				var _param = '';
				for (var pair of request.getData().entries()) {
					if(pair[0]&&(pair[1] || pair[1]===0))
						_param += pair[0]+'='+pair[1].toString().trim()+'&';
				}
				_param = _param.slice(0, -1);
				url += '?'+_param;
			}
			xhttp.open(request.getMethod(), url, true);
			for(var header of request.getHeaders())
				xhttp.setRequestHeader(header.name, header.value);
			xhttp.responseType = request.getResponseType();
			xhttp.onreadystatechange = async function(){
				var res = new Response();
				if(xhttp.readyState === XMLHttpRequest.DONE){
					var response = null;
					res.code = 0;
					res.status = xhttp.status;
					if(xhttp.status !== 200) {
						var statusType = Math.floor(xhttp.status/100);
						if(statusType!=4){
							response = Cacher.getCached(request);
							if(response instanceof Promise){
								var promise_hold = response;
								response = await promise_hold;
							}									
						}
						if(!response){
							res.code = -10;
							res.content = {'error':'Connection Error'};
						}
					}
					if(!response)
						response = xhttp.response;
					if(response){
						res.code = 0;
						res.content = response;
					}else if(xhttp.status === 200){
						res.code = -11;
						res.content = {'error':'No data response'};
					}
					if(xhttp.status === 200){
						Cacher.cache(request,response);
					}
					if(res.code==0)
						resolve(res);
					else
						reject(res);
				}
			};
			xhttp.send(request.getData());
		});
	}
};
ExternalConnector.instance = null;