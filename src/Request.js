export default class Request{
	constructor(method,uri,data,headers = {}){
		this.method = method;
		this.uri = uri;
		if(data != null)
			this.setData(data)
		else
			this.data = null;
		this.headers = headers;
		for(var hname in this.headers)
			if(this.headers[hname] && (typeof this.headers[hname] != 'string'))
				this.headers[hname] = this.headers[hname].toString();
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
	*getHeaders(){
		for(var x in this.headers){
			var v = this.headers[x];
			yield {'name':x,'value':v};
		}
	}
}