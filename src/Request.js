export default class Request{
	constructor(method,uri,data,headers = {}){
		this.method = method;
		this.uri = uri;
		if(data != null)
			this.setData(data)
		else
			this.data = null;
		this.headers = headers;			
	}
	setHeader(a,b = null){
		if(this.headers==null)
			this.headers = {};
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
	*getHeaders(){
		for(var x in this.headers){
			var v = this.headers[x];
			yield {'name':x,'value':v};
		}
	}
}