export default class Request{
	constructor(method,uri,data,headers = {}, options = null){
		this.method = method;
		this.uri = uri;
		this.setData(data);
		this.headers = headers;
		for(var hname in this.headers)
			if(this.headers[hname] && (typeof this.headers[hname] != 'string'))
				this.headers[hname] = this.headers[hname].toString();
		if(options && (typeof options === "string")){
			let o = options.split(";");
			options = {};
			for(let i=0; i < o.length; i++){
				o[i] = o[i].trim();
				if(o[i].startsWith("response_type:"))
					options.response_type = o[i].substr(14).trim();
				else if(o[i].startsWith("timeout:"))
					try{
						options.timeout = parseInt(o[i].substr(8).trim());
					}catch{}
			}
		}
		this.options = {
			'response_type': (options && options.response_type) ? options.response_type : 'json',
			'timeout': (options && options.timeout) ? options.timeout : null
		};
	}
	setHeader(a,b = null){
		if(this.headers==null)
			this.headers = {};
		if(b && (typeof b != 'string'))
			b = b.toString();
		this.headers[a] = b;
	}
	getData(){
		return this.data;
	}
	getMethod(){
		return this.method;
	}
	getUri(){
		return this.uri;
	}
	getResponseType(){
		return this.options.response_type;
	}
	getTimeout(){
		return this.options.timeout;
	}
	*getHeaders(){
		for(var x in this.headers){
			var v = this.headers[x];
			yield {'name':x,'value':v};
		}
	}
}