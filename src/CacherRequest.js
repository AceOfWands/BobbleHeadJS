import Request from './Request.js';
import ConnectorRequest from './ConnectorRequest.js';
import md5 from 'md5-jkmyers';

export default class CacherRequest extends Request{
	constructor(method,uri,data,headers = {},response_type = null){
		super(method,uri,data,headers,response_type);
		var promises = this.promise;
		delete this.promise;
		return promises || this;
	}
	setData(a,b = null){
		this.promise = null;
		if(a instanceof FormData){
			this.data = {};
			for(var x of a.entries())
				if(x[1] instanceof Blob){
					if(this.promise == null)
						this.promise = [];
					this.promise.push(new Promise(function(name, resolve, reject){
						var reader = new FileReader();
						reader.onload = function(){
							this.data[name] = md5(reader.result);
							resolve(this);
						}.bind(this);
						reader.readAsText(x[1]);
					}.bind(this, x[0])));
				}else
					this.data[x[0]] = x[1];
		}else if(b != null && (typeof a === "string")){
			if(this.data == null)
				this.data = {};
			this.data[a] = b;
		}else
			this.data = a;
	}
	toRequest(){
		var toData = null;
		if(this.data != null){
			toData = new FormData();
			for(var x in this.data)
				toData.append(x, this.data[x]);
		}
		return new ConnectorRequest(this.method,this.uri,toData,this.headers,this.response_type);
	}
	static fromObject(obj){
		if(('method' in obj) && ('uri' in obj) && ('data' in obj))
			return new CacherRequest(obj.method,obj.uri,obj.data,obj.headers || undefined,obj.response_type || undefined);
		return null;
	}
	equal(x){
		if(!(x instanceof Request)) return false;
		if(this.method != x.getMethod()) return false;
		if(this.uri != x.getUri()) return false;
		if(this.getResponseType() != x.getResponseType()) return false;
		var xData = x.getData();
		var promises = null;
		if(xData != null && this.data != null)
			if(x instanceof ConnectorRequest){
				var size = Object.keys(this.data).length;
				var xsize = 0;
				for(var i of xData){
					if(i[1] instanceof Blob){
						promises.push(new Promise(function(resolve, reject){
							var reader = new FileReader();
							reader.onload = function(){
								resolve(this.data[i[0]] == md5(reader.result));
							}.bind(this);
							reader.readAsText(i[1]);
						}.bind(this)));
					}else if(this.data[i[0]] != i[1]) return false;
					xsize++;
				}
				if(xsize != size) return false;
			}else if(x instanceof CacherRequest){
				if(Object.keys(xData).length != Object.keys(this.data).length) return false;
				for(var i in this.data)
					if(xData[i] != this.data[i]) return false;
			}
		else if(xData !== this.data) return false;
		return !promises ? true : Promise.all(promises);
	}
}