var BobbleHead = {
	User: class{
		constructor(username,password,roles){
			this.username = username;
			this.password = password;
			this.roles = roles
		}
		//isAdmin(){}
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
		constructor(token){
			this.token = token;
		}
		getToken(){
			return token;
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
		constructor(method,uri,data,headers = []){
			this.method = method;
			this.uri = uri;
			this.data = (data instanceof FormData) ? data : null;
			this.headers = headers;			
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
		},
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
			return BobbleHead.AccessController.currentSession;
		}
		static init(){
			//TODO: extract session from DB
		}
	},
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
	RestServerConnector = class{
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
			//TODO:
		}
		static cache(requestCode, response){
			//TODO:
		}
		static getCached(requestCode){
			//TODO:
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
			if(BobbleHead.Database.instance == null)
				BobbleHead.Database.instance = new PouchDB('bobblehead');
			return BobbleHead.Database.instance;
		}
	}
	defaultCallback: function(){
		console.log(arguments);
	},
	pageNotFound: class{
		constructor(message){
			this.name = 'pageNotFound';
			this.message = message;
		}
	},
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
			constructor(name, style, id = null, default = null, path = null, required = null, repeating = null, fixed = null, options = null){
				this.id = id;
				this.name = name;
				this.style = style;
				this.default = default;
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
	}
}
//static class attribute
BobbleHead.RolePool.roles = {};
BobbleHead.StylePool.styles = {};
BobbleHead.InternalConnector.instance = null;
BobbleHead.AccessController.currentSession = null;
BobbleHead.RestServerConnector.instance = null;
BobbleHead.RestServerConnector.serverList = [];
BobbleHead.Cacher.cacheHeap = null;
BobbleHead.Cacher.cacheMap = null;
BobbleHead.Database.instance = null;
//Library Sub-class
BobbleHead.CommonUser = class extends BobbleHead.User{
	isAdmin(){
		return false;
	}
};
BobbleHead.Administrator = class extends BobbleHead.User{
	isAdmin(){
		return true;
	}
};
BobbleHead.ComponentConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.ModuleConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.VirtualPageConfiguration = class extends BobbleHead.GenericConfiguration{};
BobbleHead.Rest.Request = class extends BobbleHead.Rest.CommunicationMethod{};
BobbleHead.Rest.Response = class extends BobbleHead.Rest.CommunicationMethod{};
