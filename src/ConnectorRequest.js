import Request from './Request.js';
import CacherRequest from './CacherRequest.js';
import md5 from 'md5-jkmyers';

export default class ConnectorRequest extends Request{
	constructor(method,uri,data,headers = {},options = null){
		super(method,uri,data,headers,options);	
	}
	getDataAsObject(){
		var r = null;
		if(this.data!=null){
			r = {};
			for(var x of this.data.entries())
				r[x[0]] = x[1];
		}
		return r;
	}
	setData(a,b = null){
		if(a == null)
			this.data = null;
		else
			if(a instanceof FormData){
				this.data = a;
			}else if(b != null && (typeof a === "string")){
				if(this.data == null)
					this.data = new FormData();
				this.data.set(a,b);
			}else if(typeof a === "string"){
				this.data = a;
			}else{
				for(var p in a)
					this.setData(p, a[p]);
			}
	}
	equal(x){
		if(!(x instanceof Request)) return false;
		if(this.method != x.getMethod()) return false;
		if(this.uri != x.getUri()) return false;
		if(this.getResponseType() != x.getResponseType()) return false;
		var xData = x.getData();
		var promises = null;
		if(xData != null && this.data != null){
			var size = 0;
			if(x instanceof ConnectorRequest){
				var xsize = 0;
				for(var k of xData.keys())
					xsize++;
				if(xsize != size) return false;
				for(var i of this.data){
					if(xData.get(i[0]) != i[1]) return false;
					size++;
				}
			}else if(x instanceof CacherRequest){
				for(var i of this.data){
					if(i[1] instanceof Blob){
						promises.push(new Promise(function(resolve, reject){
							var reader = new FileReader();
							reader.onload = function(){
								resolve(xData[i[0]] == md5(reader.result));
							}.bind(this);
							reader.readAsText(i[1]);
						}));
					}else if(xData[i[0]] != i[1]) return false;
					size++;
				}
				if(Object.keys(xData).length != size) return false;
			}
		}
		else if(xData !== this.data) return false;
		return !promises ? true : Promise.all(promises);
	}
	toCacherRequest(){
		return new CacherRequest(this.method,this.uri,this.data,this.headers,this.options);
	}
}