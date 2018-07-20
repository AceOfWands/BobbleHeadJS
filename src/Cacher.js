import Database from './Database.js';
import {log, HeapNode, ReverseHeap} from './Util.js';
import CacherRequest from './CacherRequest.js';
import CacherLoadedEvent from './Events/CacherLoadedEvent.js';

export default class Cacher{
	static init(maxcached, whitelist, blacklist){
		return new Promise(function(resolve, reject){
			var db = Database.getInstance();
			db.get('cacheMap').then(function(cacheMap) {
				if(cacheMap)
					Cacher.cacheMap = cacheMap;
				else{
					Cacher.cacheMap = {'_id':'cacheMap', 'length':0};
					log('Cacher',0,'Cacher map not found');
				}
				db.get('cacheHeap').then(function(cacheHeap) {
					if(cacheHeap){
						var holdNodeArray = [];
						for(var i in cacheHeap.array){
							var _val = (cacheHeap.array[i]).value;
							var val = new CacherRequest(_val.method,_val.uri,_val.data,_val.headers);
							holdNodeArray.push(new HeapNode((cacheHeap.array[i]).key, val));
						}
						var rev = cacheHeap._rev;
						cacheHeap = new ReverseHeap(holdNodeArray);
						cacheHeap._id = 'cacheHeap';
						cacheHeap._rev = rev;
						var hold = cacheHeap.getFirst();
						if(hold!=null){
							var red = hold.getKey()-1;
							if(red>0)
								for(var node of cacheHeap.getNodes())
									node.reduceKey(red);
						}
						Cacher.cacheHeap = cacheHeap;
					}else{
						Cacher.cacheHeap = new ReverseHeap();
						Cacher.cacheHeap._id = 'cacheHeap';
						log('Cacher',0,'Cacher heap not found');
					}
					document.dispatchEvent(new CacherLoadedEvent());
					resolve();
				}).catch(function(err) {
					Cacher.cacheHeap = new ReverseHeap();
					Cacher.cacheHeap._id = 'cacheHeap';
					log('Cacher heap not found', 1, err);
					document.dispatchEvent(new CacherLoadedEvent());
					resolve();
				});
			}).catch(function(err) {
				Cacher.cacheMap = {'_id':'cacheMap', 'length':0};
				Cacher.cacheHeap = new ReverseHeap();
				Cacher.cacheHeap._id = 'cacheHeap';
				log('Cacher map not found', 1, err);
				document.dispatchEvent(new CacherLoadedEvent());
				resolve();
			});
			Cacher.whitelist = whitelist;
			Cacher.blacklist = blacklist;
			Cacher.maxCached = maxcached;
		}.bind(this)).catch(function(e) {
			log(e);
		});
	}
	static parseUri(uri){
		var parsed_uri = btoa(uri);
		var toTrim = 0;
		for(var i = (parsed_uri.length -1); i>=0; i--)
			if(parsed_uri[i] == '=')
				toTrim++;
			else
				break;
		if(toTrim>0)
			return parsed_uri.substring(0, parsed_uri.length - toTrim);
		else
			return parsed_uri;
	}
	static cache(request, response){
		var hold_request = request.toCacherRequest();
		var cache_converted_request_func = function(response, obj){
			var request = obj.pop();
			if(Cacher.blacklist.indexOf(request.uri) == -1){
				var db = Database.getInstance();
				var parsed_uri = Cacher.parseUri(request.uri);
				var found = -1;
				if(Cacher.cacheMap[request.method] &&
					Cacher.cacheMap[request.method][parsed_uri]){
						for(var i in Cacher.cacheMap[request.method][parsed_uri]){
							if(!(Cacher.cacheMap[request.method][parsed_uri][i][0] instanceof CacherRequest))
								Cacher.cacheMap[request.method][parsed_uri][i][0] = CacherRequest.fromObject(Cacher.cacheMap[request.method][parsed_uri][i][0]);
							if(request.equal(Cacher.cacheMap[request.method][parsed_uri][i][0])){
								found = i;
								break;
							}
						}
				}
				if(found != -1){
					var hold = Cacher.cacheHeap.findByValue(request);
					var incNodeFunc = function(db, ele){
						ele.incKey();
						Cacher.cacheHeap.reheap();
						db.put(Cacher.cacheHeap,{rev: true}).then(function (response) {
							Cacher.cacheHeap._rev = response.rev;
							log('Saved Cacher heap', 0, response);
						}).catch(function (err) {
							log('Cannot save Cacher heap', 1, err);
						});
						Cacher.cacheMap[request.method][parsed_uri][found][1] = response;
					}
					if(hold!=null)
						hold.then(incNodeFunc.bind(this, db)).catch(function(){log('URL in whitelist', 0, 'Cannot retrive node from Cacher heap')});
				}else{
					if(Cacher.cacheMap.length > Cacher.maxCached)
						for(var i = Cacher.nodesPartNum; i>0; i--){
							var hold = Cacher.cacheHeap.pop();
							var reqToDel = hold.getValue();
							var parsed_toDelUri = Cacher.parseUri(reqToDel.uri);
							for(var j = (Cacher.cacheMap[reqToDel.method][parsed_toDelUri]).length; j>0; j--){
								var _req = (Cacher.cacheMap[reqToDel.method][parsed_toDelUri]).shift();
								if(!reqToDel.equal(_req[0])){
									if(!(_req[0] instanceof CacherRequest))
										_req[0] = CacherRequest.fromObject(_req[0]);
									(Cacher.cacheMap[reqToDel.method][parsed_toDelUri]).push(_req);
								}else{
									Cacher.cacheMap.length--;
									break;
								}
							}
						}
					if(Cacher.whitelist.indexOf(request.uri) == -1){
						var node = new HeapNode(1,request);
						Cacher.cacheHeap.addNode(node);
						db.put(Cacher.cacheHeap,{rev: true}).then(function (response) {
							Cacher.cacheHeap._rev = response.rev;
							log('Saved Cacher heap', 0, response);
						}).catch(function (err) {
							log('Cannot save Cacher heap', 1, err);
						});
					}
					if(!Cacher.cacheMap[request.method])
						Cacher.cacheMap[request.method] = {};
					if(!Cacher.cacheMap[request.method][parsed_uri])
						Cacher.cacheMap[request.method][parsed_uri] = [];
					(Cacher.cacheMap[request.method][parsed_uri]).push([request, response]);
					Cacher.cacheMap.length++;
					db.put(Cacher.cacheMap,{rev: true}).then(function (response) {
						Cacher.cacheMap._rev = response.rev;
						log('Saved Cacher map', 0, response);
					}).catch(function (err) {
						log('Cannot save Cacher map', 1, err);
					});
				}
			}
		};
		if(!(hold_request instanceof CacherRequest))
			Promise.all(hold_request).then(cache_converted_request_func.bind(this, response));
		else
			(cache_converted_request_func.bind(this))(response, [hold_request]);
	}
	static getCached(request){
		var parsed_uri = Cacher.parseUri(request.uri);
		var promises = [];
		if(Cacher.cacheMap[request.method] &&
			Cacher.cacheMap[request.method][parsed_uri])
			for(var i in Cacher.cacheMap[request.method][parsed_uri]){
				if(!(Cacher.cacheMap[request.method][parsed_uri][i][0] instanceof CacherRequest))
					Cacher.cacheMap[request.method][parsed_uri][i][0] = CacherRequest.fromObject(Cacher.cacheMap[request.method][parsed_uri][i][0]);
				var compareResult = request.equal(Cacher.cacheMap[request.method][parsed_uri][i][0]);
				if(compareResult instanceof Promise)
					promises.push(compareResult.then(function(_method, _uri, _i, flag){
						if(flag)
							return this[_method][_uri][_i][1];
						return null;
					}.bind(Cacher.cacheMap, request.method, parsed_uri, i)));
				else if(compareResult == true)
					return Cacher.cacheMap[request.method][parsed_uri][i][1];
			}
		if(promises.length > 0)
			return Promise.all(promises).then(function(response){
				for(var i=0; i<response.length; i++)
					if(response[i] != null)
						return response[i];
			});
		else
			return null;
	}
};
Cacher.cacheHeap = null;
Cacher.cacheMap = null;
Cacher.whitelist = null;
Cacher.blacklist = null;
Cacher.maxCached = 1000;
Cacher.nodesPartNum = 3;