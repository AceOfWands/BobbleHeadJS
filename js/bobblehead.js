var BobbleHead = {
	UserPool: class{
		static getUser(username){
			return BobbleHead.UserPool.users[username];
		}
		static addUser(user){
			try{
				BobbleHead.UserPool.users[user.username] = user;
			}catch(e){
				BobbleHead.log(e);
			}
		}
	},
	User: class{
		constructor(username,password,roles){
			this.username = username;
			this.password = password;
			this.roles = roles
		}
		getRoles(){
			return this.roles;
		}
		hasRole(role){
			return this.roles.indexOf(role) != -1;
		}
		giveRole(role){
			this.roles.push(role);
		}
	},
	Role: class{
		constructor(name){
			this.name;
		}
	},
	RolePool: class{
		static getRole(name){
			if(!BobbleHead.RolePool.roles[name])
				BobbleHead.RolePool.roles[name] = new BobbleHead.Role(name);
			return BobbleHead.RolePool.roles[name];
		}
	},
	Session: class{
		constructor(info = null){ //, user = null
			this.info = info;
			//this.user = user;
		}
		getInfo(){
			return this.info;
		}
	},
	Response: class{
		constructor(code,status,content){
			this.code = code;
			this.status = status;
			this.content = content;
		}
	},
	Request: class{
		constructor(method,uri,data,headers = {}){
			this.method = method;
			this.uri = uri;
			this.data = (data instanceof FormData) ? data : null;
			this.headers = headers;			
		}
		setHeader(a,b = null){
			if(this.headers==null)
				this.headers = {};
			this.headers[a] = b;
		}
		setData(a,b = null){
			if(a instanceof FormData)
				this.data = data;
			else if(b != null && (a instanceof String)){
				if(this.data == null)
					this.data = new FormData();
				this.data.set(a,b);
			}
		}
		getData(){
			//TODO:
		}
		getMethod(){
			return this.method;
		}
		getUri(){
			//TODO:
		}
		*getHeaders(){
			for(var x in this.headers){
				var v = this.headers[x];
				yield {'name':x,'value':v};
			}
		}
		hashCode(){
			return md5(this.method)+md5(this.uri)+md5(JSON.stringify(this.data));
		}
	},
	GenericConfiguration: class{
		constructor(properties = {}){
			this.properties = properties || {};
		}
		*getProperties(){
			for(var x in this.properties){
				var v = this.properties[x];
				yield {x,v};
			}
		}
		getProperty(name){
			return this.properties[name] || null;
		}
	},
	Style: class{
		constructor(name,pagePaths){
			this.name = name;
			this.pagePaths = pagePaths;
		}
		getRealPath(pageName){
			return this.pagePaths[pageName] || this.pagePaths['404'] || null;
		}
	},
	StylePool: class{
		static getStyle(name){
			if(!BobbleHead.StylePool.styles[name])
				BobbleHead.StylePool.styles[name] = new BobbleHead.Style(name);
			return BobbleHead.StylePool.styles[name];
		}
	},
	Page: class{
		constructor(name,anchoringPoints,style){
			this.name = name;
			this.anchoringPoints = anchoringPoints;
			this.style = style;
		}
	},
	InternalConnector: class{
		static getInstance(){
			if(!BobbleHead.InternalConnector.instance)
				BobbleHead.InternalConnector.instance = new BobbleHead.InternalConnector();
			return BobbleHead.InternalConnector.instance;
		}
		doRequest(vid,data = null,onSuccess = BobbleHead.defaultCallback,onFailure = BobbleHead.defaultCallback){
			try{
				if(vid==-1)
					BobbleHead.PageBuilder.pageBack();
				else
					BobbleHead.PageBuilder.buildPage(vid,data);
				onSuccess();
			}catch(e){
				onFailure(e);
			}
		}
	},
	AccessController: class{
		static doLogin(){
			//TODO: Login by ExternalConnector
		}
		static doLogout(){
			//TODO: Logout by ExternalConnector
		}
		static getCurrentSession(){
			return BobbleHead.AccessController.currentAuthMethod.getCurrentSession();
		}
		static init(authType = 'basic'){
			var selectedAuth = null;
			switch(authType){
				case 'basic':
					selectedAuth = BobbleHead.AuthenticationMethods.BasicAuthentication();
					break;
				default:
					selectedAuth = BobbleHead.AuthenticationMethods.BasicAuthentication();
					break;
			}
			BobbleHead.AccessController.currentAuthMethod = selectedAuth;
			var db = BobbleHead.Database.getInstance();
			db.get('session').then(function(session) {
				/*if(session.token && session.user){
					db.get(session.user).then(function(session,user) {
						if(user.username){
							var sessionUser = BobbleHead.UserPool.getUser(user.username);
							BobbleHead.AccessController.currentSession = new BobbleHead.Session(session.token,sessionUser);
						}else
							BobbleHead.log('AccessController',1,'Invalid user');
					}.bind(this,session)).catch(function(err) {
						BobbleHead.log(err);
					});
				}else
					BobbleHead.log('AccessController',1,'Invalid session');*/
				BobbleHead.AccessController.currentAuthMethod.replaceCurrentSession(session);
			}).catch(function(err) {
				BobbleHead.log(err);
			});
		}
	},
	AuthenticationMethod: class{
		constructor(){
			this.session = null;
		}
		prepareLoginRequest(loginInfoMap = null){
			return null;
		}
		prepareLogoutRequest(){
			return null;
		}
		parseLoginResponse(response = null){}
		parseLogoutResponse(response = null){}
		authRequest(request = null){}
		getCurrentSession(){
			return this.session;
		}
		replaceCurrentSession(session){
			this.session = session;
		}
	},
	AuthenticationMethods: {},
	ExternalConnector: class{
		static doRequest(request,onSuccess = BobbleHead.defaultCallback,onFailure = BobbleHead.defaultCallback){
			var xhttp = new XMLHttpRequest();
			xhttp.open(request.getMethod(), request.getUri(), true);
			for(var header of request.getHeaders())
				xhttp.setRequestHeader(header.name, header.value);
			xhttp.responseType = 'json';
			xhttp.onreadystatechange = function(){
				var res = new Core.ResultMessage();
				if(xhttp.readyState === XMLHttpRequest.DONE){
					var response = null;
					res.code = 0;
					res.status = xhttp.status;
					if(xhttp.status !== 200) {
						var statusType = Math.floor(xhttp.status/100);
						if(statusType!=4)
							response = Cacher.getCached(request.hashCode());
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
						Cacher.cache(request.hashCode(),response);
					}
					if(res.code==0)
						onSuccess(res);
					else
						onFailure(res);
				}
			};
			xhttp.send(request.getData());
		}
	},
	RestServerConnector: class{
		static init(){
			//TODO:
		}
		static addServer(wadl){
			//TODO:
		}
		static getInstance(){
			if(!BobbleHead.RestServerConnector.instance)
				BobbleHead.RestServerConnector.instance = new BobbleHead.RestServerConnector();
			return BobbleHead.RestServerConnector.instance;
		}
		request(resourceRequest,onSuccess = BobbleHead.defaultCallback,onFailure = BobbleHead.defaultCallback){
			//TODO:
		}
	},
	Cacher: class{
		static init(){
			var db = BobbleHead.Database.getInstance();
			db.get('cache').then(function(cache) {
				if(cache.map && cache.heap){
					var hold = cache.heap.getFirst();
					if(hold!=null){
						var red = hold.getKey()-1;
						if(red>0)
							for(var node of cache.heap.getNodes())
								node.reduceKey(red);
					}
				}else{
					BobbleHead.Cacher.cacheHeap = new BobbleHead.Util.ReverseHeap();
					BobbleHead.Cacher.cacheMap = {};
					BobbleHead.log('Cacher',0,'No cache object');
				}
			}).catch(function(err) {
				BobbleHead.log(err);
			});
		}
		static cache(requestCode, response){
			if(BobbleHead.Cacher.cacheMap[requestCode]){
				var hold = BobbleHead.Cacher.cacheHeap.findByValue(requestCode);
				hold.incKey();
				BobbleHead.Cacher.cacheHeap.reheap();
			}else{
				if(BobbleHead.Cacher.cacheMap.length > BobbleHead.Cacher.maxNodes)
					for(var i = BobbleHead.Cacher.nodesPartNum; i>0; i--){
						var hold = BobbleHead.Cacher.cacheHeap.pop();
						delete BobbleHead.Cacher.cacheMap[hold.getValue()];
					}
				var node = new BobbleHead.Util.HeapNode(1,requestCode);
				BobbleHead.Cacher.cacheHeap.addNode(node);
				BobbleHead.Cacher.cacheMap[requestCode] = response;
			}
		}
		static getCached(requestCode){
			return BobbleHead.Cacher.cacheMap[requestCode];
		}
	},
	PageBuilder: {
		buildPage: function(virtualID,data){
			//TODO:
		},
		pageBack: function(virtualID){
			//TODO:
		}
	},
	VirtualPageFactory: {
		getPage: function(virtualID, data){
			//TODO:
		}
	},
	Module: class{
		constructor(name,configuration = null, components = null){
			this.name = name;
			this.configuration = configuration;
			this.components = components;
		}
		render(){
			//TODO:
		}
	},
	Component: class{
		constructor(name,configuration = null){
			this.name = name;
			this.configuration = configuration;
		}
		render(){
			//TODO:
		}
	},
	VirtualPage: class{
		constructor(lock,page,configuration = null, rolesAllowed = null, modules = null){
			this.lock = lock;
			this.page = page;
			this.configuration = configuration;
			this.modules = modules;
			this.rolesAllowed = rolesAllowed;
		}
		build(data){
			//TODO:
		}
		cancelBuilding(){
			
		}
		registerScript(script){
			
		}
		registerStyle(style){
			
		}
		currentUserIsAdmin(){
			
		}
		currentUserHasRole(role){
			
		}
	},
	Database: class{
		static getInstance(){
			if(BobbleHead.Database.instance == null){
				BobbleHead.Database.instance = new PouchDB('bobblehead', {adapter: 'websql'});
				if (!BobbleHead.Database.instance.adapter)
					BobbleHead.Database.instance = new PouchDB('bobblehead');
			}
			return BobbleHead.Database.instance;
		}
	},
	AppController: class{
		init(xmlConfiguration){
			BobbleHead.XMLParser.parseUrl(xmlConfiguration,this.processConf.bind(this));
		}
		processConf(conf){
			//TODO:
		}
	},
	XMLParser: class{
		static getDOMParser(){
			if(BobbleHead.XMLParser.domParser == null)
				BobbleHead.XMLParser.domParser = new DOMParser();
			return BobbleHead.XMLParser.domParser;
		}
		static parseUrl(url,callback){
			var xhttp = new XMLHttpRequest();
			xhttp.open('get', url, true);
			xhttp.responseType = 'text';
			xhttp.onreadystatechange = function(callback){
				if(xhttp.readyState === XMLHttpRequest.DONE){
					callback(this.parseString(xhttp.response));
				}
			}.bind(this,callback);
			xhttp.send();
		}
		static parseString(str){
			var xmlDoc = null;
			if (window.DOMParser){
				var parser = BobbleHead.XMLParser.getDOMParser();
				xmlDoc = parser.parseFromString(txt, "text/xml");
			}else{
				xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = false;
				xmlDoc.loadXML(txt);
			}
			return this.parseXML(xmlDoc);
		}
	},
	defaultCallback: function(){
		BobbleHead.log(arguments);
	},
	pageNotFound: class{
		constructor(message){
			this.name = 'pageNotFound';
			this.message = message;
		}
	},
	log: function(data,level = null,description = null){
		if(level && description){
			if(level>1)
				console.err('['+data+'] '+description);
			else
				console.log('['+data+'] '+description)
		}else
			console.log(data);
	},
	isRemotePattern: /^http[s]?:\/\//i,
	Rest: {
		ResourceRequest: class{
			constructor(resource, crud, data){
				this.resource = resource;
				this.crud = crud;
				this.data = data || [];
			}
			getResource(){
				return this.resource;
			}
			getCRUD(){
				return this.crud;
			}
			*getData(){
				for(var x in this.data){
					var v = this.data[x];
					yield {'name':x,'value':v};
				}
			}
		},
		Server: class{
			constructor(id,resources = null, resource_types = null, params = null){
				this.id = id;
				this.resources = resources;
				this.resource_types = resource_types;
				this.params = params;
			}
		},
		Resource: class{
			constructor(id = null, path = null, type = null, queryType = null, parent = null, resource_type){
				this.id = id;
				this.path = path;
				this.type = type;
				this.queryType = queryType;
				this.parent = parent;
				this.resource_type = resource_type;
			}
		},
		ResourceType: class{
			constructor(id = null, params = null, methods = null){
				this.id = id;
				this.params = params;
				this.methods = methods;
			}
		},
		Param: class{
			constructor(name, style, id = null, _default = null, path = null, required = null, repeating = null, fixed = null, options = null){
				this.id = id;
				this.name = name;
				this.style = style;
				this._default = _default;
				this.path = path;
				this.required = required;
				this.repeating = repeating;
				this.fixed = fixed;
				this.options = options;
			}
		},
		Option: class{
			constructor(value, mediaType){
				this.value = value;
				this.mediaType = mediaType;
			}
		},
		Method: class{
			constructor(name, id = null, requests = null, responds = null){
				this.name = name;
				this.id = id;
				this.requests = null;
				this.responds = responds;
			}
		},
		CommunicationMethod: class{
			constructor(params, representations){
				this.params = params;
				this.representations = representations;
			}
		},
		Representation: class{
			constructor(id, mediaType, element, profile, params = null){
				this.id = id;
				this.mediaType = mediaType;
				this.element = element;
				this.profile = profile;
				this.params = params;
			}
		}
	},
	Util: {
		Heap: class{
			constructor(unorderedArray = null){
				if(unorderedArray)
					this.build(unorderedArray);
				else
					this.array = [];
			}
			sx(i){
				return 2*i;
			}
			dx(i){
				return (2*i)+1;
			}
			father(i){
				return parseInt(i/2);
			}
			heapify(i){
				var l = this.sx(i);
				var r = this.dx(i);
				var m = i;
				if(l<this.array.length && this.array[l].getKey() > this.array[i].getKey())
					m = l;
				if(r<this.array.length && this.array[r].getKey() > this.array[m].getKey())
					m = r;
				if(m != i){
					var h = this.array[i];
					this.array[i] = this.array[m];
					this.array[m] = h;
					this.heapify(m);
				}
			}
			build(unorderedArray){
				this.array = unorderedArray;
				this.reheap();
			}
			reheap(){
				for(var i = parseInt(this.array.length/2); i>=0; i--)
					this.heapify(i);
			}
			addNode(node){
				this.array.push(node);
				this.reheap();
			}
			pop(){
				if(this.array.length==0) return null;
				var r = this.array[0];
				this.array[0] = this.array[this.array.length - 1];
				this.array.length = this.array.length - 1;
				this.heapify(0);
				return r;
			}
			getFirst(){
				if(this.array.length==0) return null;
				return this.array[0];
			}
			findByValue(val){
				for(var i=0, l=this.array.length; i<l; i++)
					if(this.array[i].getValue()==val)
						return this.array[i];
				return null;
			}
			*getNodes(){
				for(var i=0, l=this.array.length; i<l; i++)
					yield this.array[i];
			}
		},
		HeapNode: class{
			constructor(key,value){
				this.key = key;
				this.value = value;
			}
			getKey(){
				return this.key;
			}
			incKey(){
				this.key++;
			}
			decKey(){
				this.key--;
			}
			increaseKey(i){
				this.key += i;
			}
			reduceKey(i){
				this.key -= i;
			}
			getValue(){
				return this.value;
			}
		}
	}
}
//static class attribute
BobbleHead.UserPool.users = {};
BobbleHead.RolePool.roles = {};
BobbleHead.StylePool.styles = {};
BobbleHead.InternalConnector.instance = null;
BobbleHead.AccessController.currentAuthMethod = null;
BobbleHead.RestServerConnector.instance = null;
BobbleHead.RestServerConnector.serverList = [];
BobbleHead.Cacher.cacheHeap = null;
BobbleHead.Cacher.cacheMap = null;
BobbleHead.Cacher.maxNodes = 1000;
BobbleHead.Cacher.nodesPartNum = 3;
BobbleHead.Database.instance = null;
BobbleHead.XMLParser.domParser = null;
//Library Sub-class
BobbleHead.ComponentConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.ModuleConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.VirtualPageConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.Rest.Request = class extends BobbleHead.Rest.CommunicationMethod{};
BobbleHead.Rest.Response = class extends BobbleHead.Rest.CommunicationMethod{};
BobbleHead.Util.ReverseHeap = class extends BobbleHead.Util.Heap {
	heapify(i){
		var l = this.sx(i);
		var r = this.dx(i);
		var m = i;
		if(l<this.array.length && this.array[l].getKey() < this.array[i].getKey())
			m = l;
		if(r<this.array.length && this.array[r].getKey() < this.array[m].getKey())
			m = r;
		if(m != i){
			var h = this.array[i];
			this.array[i] = this.array[m];
			this.array[m] = h;
			this.heapify(m);
		}
	}
};
BobbleHead.AuthenticationMethods.BasicAuthentication: class extends BobbleHead.AuthenticationMethod{
	prepareLoginRequest(loginInfoMap = null){
		if(loginInfoMap.name && loginInfoMap.password){
			this.session = new BobbleHead.Session(loginInfoMap);
		}else
			BobbleHead.log('BasicAuthentication',1,'Invalid user');
		return null;
	}
	prepareLogoutRequest(){
		this.replaceCurrentSession(null);
		return null;
	}
	authRequest(request = null){
		if(request!=null){
			var userInfo = this.session.getInfo();
			request.setHeader('Authorization','Basic ' + btoa(userInfo.name':'+userInfo.password));
		}
	}
}