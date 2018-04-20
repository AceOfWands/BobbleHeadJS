'use strict';

var bobblehead = (function(a){
	a.BobbleHead = {
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
			constructor(info = null){
				this.info = info;
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
			equal(x){
				if(!(x instanceof BobbleHead.Request)) return false;
				if(this.method != x.getMethod()) return false;
				if(this.uri != x.getUri()) return false;
				if(JSON.stringify(this.data) != JSON.stringify(x.getData())) return false;
				return true;
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
		Model: class{
			constructor(name){
				this.name = name;
			}
			get(proprietes){}
			update(instance){}
			save(instance){}
			destroy(instance){}
		},
		ModelInstance: class{
			constructor(id, model, change = null, allowEdit = true){
				this.id = id;
				this.model = model;
				this.change = change.bind(this);
				this.allowEdit = allowEdit;
			}
		},
		ModelPool: class{
			static getModels(){
				return BobbleHead.ModelPool.models;
			}
			static getModel(name){
				return BobbleHead.ModelPool.models[name];
			}
			static addModel(model){
				try{
					BobbleHead.ModelPool.models[model.name] = model;
				}catch(e){
					BobbleHead.log(e);
				}
			}
		},
		Route: class{
			constructor(uri1, uri2){
				if(uri1.startsWith('app://') && uri2.startsWith('app://')){
					var argMap = {};
					var count = {i: 0};
					this.uri1 = new RegExp("^" + uri1.replace(/:[^\s/]+/g, function(count, _match){
						count.i += 1;
						this[_match.substring(1)] = count.i;
						return '([\\w-]+)';
					}.bind(argMap, count)) + "$");
					this.uri2 = uri2.replace(/:[^\s/]+/g, function(_match){
						var indx = this[_match.substring(1)];
						if(indx)
							return '$'+ indx;
						else
							return _match;
					}.bind(argMap));
				}else
					throw new BobbleHead.Exceptions.InvalidRouteException();
			}
			match(uri){
				return this.uri1.test(uri);
			}
			route(uri){
				if(!this.match(uri)) return null;
				return uri.replace(this.uri1,this.uri2);
			}
		},
		Router: class{
			static route(uri){
				var r = BobbleHead.Router.routes;
				for(var i=0; i<r.length; i++){
					var t = r[i].route(uri);
					if(t) return t;
				}
				return uri;
			}
			static addRoute(route){
				try{
					BobbleHead.Router.routes.push(route);
				}catch(e){
					BobbleHead.log(e);
				}
			}
		},
		Page: class{
			constructor(path,vid,lock,configuration = null, modules = null, roles = null){
				this.path = path;
				this.vid = vid;
				this.lock = lock;
				this.configuration = configuration;
				this.modules = modules;
				this.roles = roles;
			}
		},
		PageContext: class{
			constructor(domcontainer){
				return new Sandbox(domcontainer, this);
			}
		},
		InternalConnector: class{
			static getInstance(){
				if(!BobbleHead.InternalConnector.instance)
					BobbleHead.InternalConnector.instance = new BobbleHead.InternalConnector();
				return BobbleHead.InternalConnector.instance;
			}
			doRequest(request){
				return new Promise(function(resolve, reject) {
					if(request.uri.startsWith('app://')){
						try{
							var uri = BobbleHead.Router.route(request.uri);
							var subUri = uri.substring(6);
							if(subUri.startsWith('page/')){
								var num = BobbleHead.Util.vidInURIPattern.exec(subUri.substring(5));
								if(num){
									var vid_str = num[1];
									var context = BobbleHead.Context.getGlobal();
									if(vid_str == 'back')
										context.pageBuilder.pageBack();
									else
										context.pageBuilder.buildPage(parseInt(vid_str),request.data).then(resolve).catch(reject);
								}
							}else if(subUri.startsWith('module/')){
								var subSubUri = subUri.substring(7);
								var n = subSubUri.indexOf('/');
								var moduleName = null;
								if(n>=0)
									moduleName = subSubUri.substring(0, n);
								else
									moduleName = subSubUri;
								var module = BobbleHead.ModulePool.getModule(moduleName);
								var subSubSubUri = subSubUri.substring(n);
								n = subSubSubUri.indexOf('/');
								var controllerName = null;
								if(n>=0)
									controllerName = subSubSubUri.substring(0, n);
								else
									controllerName = subSubSubUri;
								var controllr = module.getController(controllerName);
								if(controllr!=null)
									controllr(request.data, resolve, reject);
								else
									reject(new BobbleHead.Exceptions.ControllerNotFoundException());
							}
						}catch(e){
							reject(e);
						}
					}
				});
			}
		},
		AccessController: class{
			getCurrentSession(){
				if(this.currentAuthMethod){
					var sess = this.currentAuthMethod.getCurrentSession();
					if((this.controllerData.session && sess != this.controllerData.session)
						|| ((!this.controllerData.session) && sess)){
						this.saveSession(sess);
					}
					return sess;
				}
				return this.controllerData.session;
			}
			saveSession(sess){
				var db = BobbleHead.Database.getInstance();
				sess._id = 'session';
				if(this.controllerData.session)
					sess._rev = this.controllerData.session._rev;
				this.controllerData.session = sess;
				db.put(sess,{rev: true}).then(function (response) {
					this.controllerData.session._rev = response.rev;
					BobbleHead.log('Saved local session', 0, response);
				}.bind(this)).catch(function (err) {
					BobbleHead.log('Cannot save local session', 1, err);
				});
			}
			processRequest(request){
				if(this.currentAuthMethod){
					this.currentAuthMethod.processRequest(request);
				}
			}
			processPage(page){
				if(this.currentAuthMethod){
					this.currentAuthMethod.processPage(page);
				}
			}
			processVirtualPage(vpage){
				if(this.currentAuthMethod){
					this.currentAuthMethod.processVirtualPage(vpage);
				}
			}
			init(authType = 'none'){
				return new Promise(function(resolve, reject){
					this.currentAuthMethod = BobbleHead.AuthenticationMethods.getMethod(authType) ||
						BobbleHead.AuthenticationMethods.getMethod('none');
					if(!(this.currentAuthMethod instanceof BobbleHead.AuthenticationMethod))
						throw new BobbleHead.Exceptions.InvalidAuthenticationMethod();
					var db = BobbleHead.Database.getInstance();
					this.controllerData = {};
					db.get('session').then(function(session) {
						this.controllerData.session = session;
						this.currentAuthMethod.replaceCurrentSession(session);
						BobbleHead.log('Fetched local session', 0, session);
						document.dispatchEvent(new BobbleHead.AccessControllerLoadedEvent());
						resolve();
					}.bind(this)).catch(function(err) {
						this.controllerData.session = null;
						BobbleHead.log('Cannot retrive local session', 1, err);
						document.dispatchEvent(new BobbleHead.AccessControllerLoadedEvent());
						resolve();
					}.bind(this));
				}.bind(this));
			}
		},
		AuthenticationMethod: class{
			constructor(){
				this.session = null;
			}
			processRequest(request = null){}
			processPage(page = null){}
			processVirtualPage(vpage = null){}
			getCurrentSession(){
				return this.session;
			}
			replaceCurrentSession(session){
				this.session = session;
			}
		},
		AuthenticationMethods: class{
			static addMethod(name, method, args = null){
				BobbleHead.AuthenticationMethods.methods[name] = [method, args];
			}
			static getMethod(name){
				var retrive = BobbleHead.AuthenticationMethods.methods[name];
				return (retrive) ? (new (BobbleHead.Util.execFuncWithArgList(retrive[0], retrive[1]))()) : null;
			}
		},
		ExternalConnector: class{
			static getInstance(){
				if(!BobbleHead.ExternalConnector.instance)
					BobbleHead.ExternalConnector.instance = new BobbleHead.ExternalConnector();
				return BobbleHead.ExternalConnector.instance;
			}
			doRequest(request){
				return new Promise(function(resolve, reject) {
					var xhttp = new XMLHttpRequest();
					var url = encodeURI(request.uri);
					if(request.method == 'get' && params){
						var _param = '';
						for (var pair of request.data.entries()) {
							if(pair[0]&&(pair[1] || pair[1]===0))
								_param += pair[0]+'='+pair[1].toString().trim()+'&';
						}
						_param = _param.slice(0, -1);
						url += '?'+_param;
					}
					xhttp.open(request.getMethod(), url, true);
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
									response = BobbleHead.Cacher.getCached(request);
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
								BobbleHead.Cacher.cache(request,response);
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
		},
		GenericConnector: class{
			request(request,onSuccess = BobbleHead.defaultCallback,onFailure = BobbleHead.defaultCallback){
				return new Promise(function(resolve, reject) {
					var test = BobbleHead.Util.isRemoteURIPattern.test(request.uri);
					var connector = null;
					var context = BobbleHead.Context.getGlobal();
					context.accessController.processRequest(request);
					if(!test){
						connector = BobbleHead.InternalConnector.getInstance();
					}else{
						connector = BobbleHead.ExternalConnector.getInstance();
					}
					connector.doRequest(request).then(resolve).catch(reject);
				});
			}
		},
		Cacher: class{
			static init(maxcached, whitelist, blacklist){
				return new Promise(function(resolve, reject){
					var db = BobbleHead.Database.getInstance();
					db.get('cacheMap').then(function(cacheMap) {
						if(cacheMap)
							BobbleHead.Cacher.cacheMap = cacheMap;
						else{
							BobbleHead.Cacher.cacheMap = {};
							BobbleHead.log('Cacher',0,'Cacher map not found');
						}
						
						db.get('cacheHeap').then(function(cacheHeap) {
							if(cacheHeap){
								var hold = cacheHeap.getFirst();
								if(hold!=null){
									var red = hold.getKey()-1;
									if(red>0)
										for(var node of cacheHeap.getNodes())
											node.reduceKey(red);
								}
								BobbleHead.Cacher.cacheHeap = cacheHeap;
							}else{
								BobbleHead.Cacher.cacheHeap = new BobbleHead.Util.ReverseHeap();
								BobbleHead.log('Cacher',0,'Cacher heap not found');
							}
							document.dispatchEvent(new BobbleHead.CacherLoadedEvent());
							resolve();
						}).catch(function(err) {
							BobbleHead.log('Cacher heap not found', 1, err);
							document.dispatchEvent(new BobbleHead.CacherLoadedEvent());
							resolve();
						});
					}).catch(function(err) {
						BobbleHead.log('Cacher map not found', 1, err);
						document.dispatchEvent(new BobbleHead.CacherLoadedEvent());
						resolve();
					});
					BobbleHead.Cacher.whitelist = whitelist;
					BobbleHead.Cacher.blacklist = blacklist;
					BobbleHead.Cacher.maxCached = maxcached;
				}.bind(this));
			}
			static cache(request, response){
				if(BobbleHead.Cacher.blacklist.indexOf(request.uri) == -1){
					var db = BobbleHead.Database.getInstance();
					if(BobbleHead.Cacher.cacheMap[request.method] &&
						BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)] &&
						BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)][md5(JSON.stringify(request.data))]){
							var hold = BobbleHead.Cacher.cacheHeap.findByValue(request);
							hold.incKey();
							BobbleHead.Cacher.cacheHeap.reheap();
							db.put(BobbleHead.Cacher.cacheHeap,{rev: true}).then(function (response) {
								BobbleHead.Cacher.cacheHeap._rev = response.rev;
								BobbleHead.log('Saved Cacher heap', 0, response);
							}).catch(function (err) {
								BobbleHead.log('Cannot save Cacher heap', 1, err);
							});
							BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)][md5(JSON.stringify(request.data))] = response;
					}else{
						if(BobbleHead.Cacher.cacheMap.length > BobbleHead.Cacher.maxCached)
							for(var i = BobbleHead.Cacher.nodesPartNum; i>0; i--){
								var hold = BobbleHead.Cacher.cacheHeap.pop();
								var reqToDel = hold.getValue();
								delete BobbleHead.Cacher.cacheMap[reqToDel.method][btoa(reqToDel.uri)][md5(JSON.stringify(reqToDel.data))];
							}
						if(BobbleHead.Cacher.whitelist.indexOf(request.uri) == -1){
							var node = new BobbleHead.Util.HeapNode(1,request);
							BobbleHead.Cacher.cacheHeap.addNode(node);
						}
						if(!BobbleHead.Cacher.cacheMap[request.method])
							BobbleHead.Cacher.cacheMap[request.method] = {};
						if(!BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)])
							BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)] = {};
							BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)][md5(JSON.stringify(request.data))] = response;
							db.put(BobbleHead.Cacher.cacheMap,{rev: true}).then(function (response) {
								BobbleHead.Cacher.cacheMap._rev = response.rev;
								BobbleHead.log('Saved Cacher map', 0, response);
							}).catch(function (err) {
								BobbleHead.log('Cannot save Cacher map', 1, err);
							});
					}
				}
			}
			static getCached(request){
				if(BobbleHead.Cacher.cacheMap[request.method] &&
					BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)])
					return BobbleHead.Cacher.cacheMap[request.method][btoa(request.uri)][md5(JSON.stringify(request.data))];
				return null;
			}
		},
		PageBuilder: class {
			constructor(){
				this.pageStack = [];
				this.container = null;
				this.documentProxy = null;
				this.currentPage = null;
			}
			checkPage(page){
				var context = BobbleHead.Context.getGlobal();
				context.accessController.processPage(page);
			}
			checkVirtualPage(vpage){
				var context = BobbleHead.Context.getGlobal();
				context.accessController.processVirtualPage(vpage);
			}
			buildPage(virtualID, data){
				return new Promise(function(resolve, reject) {
					var page = BobbleHead.PageFactory.getPage(virtualID);
					if(page){
						if(!page.lock && this.currentPage!=null)
							this.pageStack.push(this.currentPage);
						if(page.lock)
							this.pageStack = [];
						var domcontainer = document.getElementById(this.container);
						var pageContx = new BobbleHead.PageContext(domcontainer);
						this.currentPage = new BobbleHead.VirtualPage(page, data, pageContx, resolve, reject);
						this.checkVirtualPage(this.currentPage);
						this.buildPageByObject(page, data, pageContx, resolve, reject);
					}else
						reject(new BobbleHead.Exceptions.PageNotFoundException());
				}.bind(this));
			}
			buildPageByObject(page, data, pageContext, onSuccess = BobbleHead.defaultCallback, onFailure = BobbleHead.defaultCallback){
				this.checkPage(page);
				var xhttp = new XMLHttpRequest();
				xhttp.open("GET", page.path, true);
				xhttp.onreadystatechange = async function(data, sandbox, modulesToLoad, onSuccess, onFailure){
					if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 404)
						onFailure(new BobbleHead.Exceptions.PageNotFoundException());
					else if(xhttp.readyState === XMLHttpRequest.DONE){
						var context = BobbleHead.Context.getGlobal();
						var appContainer = document.getElementById(this.container);
						appContainer.innerHTML = Mustache.render(xhttp.response,
							{pageData: data, models: BobbleHead.ModelPool.getModels()});
						
						var js = appContainer.getElementsByTagName("script");
						var lastscript = null;
						for(var i=0; i<js.length; i++){
							if(js[i].getAttribute('src')!="" && js[i].getAttribute('src')!=null){
								var scriptfile = js[i].getAttribute('src');
								var nsync = js[i].getAttribute('async');
								if(nsync != 'true' && lastscript != null)
									await lastscript;
								var scriptprom = new Promise(function(resolve, reject){
									var xhttp2 = new XMLHttpRequest();
									xhttp2.open('get', scriptfile, true);
									xhttp2.responseType = 'text';
									xhttp2.onreadystatechange = function(sandbox){
										if(this.readyState === XMLHttpRequest.DONE){
											try{
												sandbox.execCode(this.response);
											}catch(e){
												BobbleHead.log('Execution of scriptfile: '+scriptfile, 3, e);
											}
											resolve();
										}
									}.bind(xhttp2,sandbox);
									xhttp2.send();
								});
								if(nsync != 'true')
									lastscript = scriptprom;
							}else
								try{
									pageContext.execCode(js[i].innerHTML);
								}catch(e){
									BobbleHead.log('Execution of script code', 3, e);
								}
								
						}
						var a = appContainer.getElementsByTagName("a");
						for(var i=0; i<a.length; i++){
							if(!a[i].hasAttribute('bbh-ignore') && !BobbleHead.Util.isRemoteURIPattern.test(a[i].getAttribute('href')))
								a[i].onclick = function(connector){
									var req = new BobbleHead.Request('GET', this.getAttribute('href'), null); //TODO: data-*
									connector.request(req);
								}.bind(a[i],context.defaultConnector);
						}
						var f = appContainer.getElementsByTagName("form");
						for(var i=0; i<f.length; i++){
							if(!f[i].hasAttribute('bbh-ignore')){
								f[i].submit = function(connector){
									for(var e of this.querySelectorAll('[name]')){
										if(!e.checkValidity()){
											e.reportValidity();
											return;
										}
									}
									var data = new FormData(this);
									var req = new BobbleHead.Request(this.getAttribute('method'), this.getAttribute('action'), data);
									connector.request(req);
								}.bind(f[i],context.defaultConnector);
							}
						}
						var modpromises = [];
						for(var mod of BobbleHead.ModulePool.getModules()){
							if(modulesToLoad != null && modulesToLoad.indexOf(mod.name)>-1)
								for(var e of appContainer.querySelectorAll('[bbh-module*="'+mod.name+'"]')){
									e.setAttribute('bbh-manipulating','true');
									var sand = new Sandbox(e, context.clone());
									var modpromise = sand.execFunction(mod.manipulate, [], mod);
									modpromise.then(function(){
										e.setAttribute('bbh-manipulating','false');
									});
									modpromises.push(modpromise);
								}
						}
						Promise.all(modpromises).then(function(){
							document.dispatchEvent(new BobbleHead.PageReadyEvent());
							appContainer.dispatchEvent(new BobbleHead.PageReadyEvent());
							onSuccess();
						});
						
					}
				}.bind(this, data, pageContext, page.modules, onSuccess, onFailure);
				xhttp.send(null);
			}
			pageBack(){
				var vpage = this.pageStack.pop();
				if(vpage){
					this.checkVirtualPage(vpage);
					this.buildPageByObject(vpage.page, vpage.data, vpage.context, vpage.success, vpage.fail);
				}else
					throw new BobbleHead.Exceptions.PageNotFoundException();
			}
		},
		PageFactory: {
			pages: {},
			getPage: function(virtualID){
				return BobbleHead.PageFactory.pages[virtualID];
			},
			addPage: function(page){
				try{
					BobbleHead.PageFactory.pages[page.vid] = page;
				}catch(e){
					BobbleHead.log(e);
				}
			}
		},
		Module: class{
			constructor(name){
				this.name = name;
				this.configuration = {};
				this.__controllers = {};
			}
			controller(name, routine){
				this.__controllers[name] = routine.bind(this);
				return this;
			}
			getController(name){
				return this.__controllers[name];
			}
			init(configuration){
				this.configuration = configuration;
			}
			manipulate(){}
		},
		ModulePool: class{
			static *getModules(){
				for(var x in BobbleHead.ModulePool.modules){
					if(BobbleHead.ModulePool.modules[x] instanceof BobbleHead.Module)
						yield BobbleHead.ModulePool.modules[x];
				}
			}
			static getModule(name){
				return BobbleHead.ModulePool.modules[name];
			}
			static addModule(module){
				try{
					BobbleHead.ModulePool.modules[module.name] = module;
				}catch(e){
					BobbleHead.log(e);
				}
			}
		},
		VirtualPage: class{
			constructor(page, data, context, success, fail){
				this.page = page;
				this.data = data;
				this.context = context;
				this.success = success;
				this.fail = fail;
			}
		},
		Database: class{
			static getInstance(){
				if(BobbleHead.Database.instance == null){
					BobbleHead.Database.instance = new PouchDB('bobblehead');
					if (!BobbleHead.Database.instance.adapter)
						BobbleHead.Database.instance = new PouchDB('bobblehead');
				}
				return BobbleHead.Database.instance;
			}
		},
		AppController: class{
			constructor(xmlConfiguration){
				this.moduleOnLoad = [];
				this.initialization = true;
				BobbleHead.XMLParser.parseUrl(xmlConfiguration,this.processConf.bind(this));
			}
			registerModel(model){
				BobbleHead.ModelPool.addModel(model);
			}
			registerModule(module){
				if(this.initialization)
					this.moduleOnLoad.push(module);
				else
					BobbleHead.ModulePool.addModule(module);
			}
			registerRoute(route){
				BobbleHead.Router.addRoute(route);
			}
			processConf(conf){
				if(!conf) return;
				try{
					var temp_configuration = conf.getElementsByTagName('configuration')[0];
					var hold_conf = {};
					hold_conf.container = (temp_configuration.getElementsByTagName('container')[0]).textContent;
					hold_conf.base_url = (temp_configuration.getElementsByTagName('base_url')[0]).textContent;
					var pageBuilder_conf = (temp_configuration.getElementsByTagName('pageBuilder')[0]);
					var cache_whitelist = [];
					var cache_blacklist = [];
					var cache_maxcached = 1000;
					var cacher_conf = (temp_configuration.getElementsByTagName('cacher')[0]);
					if(cacher_conf){
						cache_maxcached = parseInt(cacher_conf.getAttribute('max-cached'));
						for( var b of cacher_conf.getElementsByTagName('block')){
							cache_blacklist.push(b.getAttribute('url'));
						}
						for( var p of cacher_conf.getElementsByTagName('persist')){
							cache_whitelist.push(p.getAttribute('url'));
						}
					}
					var cacher_promise = BobbleHead.Cacher.init(cache_maxcached, cache_whitelist, cache_blacklist);
					var page_container = temp_configuration.getElementsByTagName('pages')[0];
					var pages_index = page_container.getElementsByTagName('index')[0];
					var pages_path = page_container.getAttribute('path');
					for( var p of page_container.getElementsByTagName('page')){
						var modulesAll = null;
						var rolesAllowed = null;
						if(p.getAttribute('modulesAllowed'))
							modulesAll = p.getAttribute('modulesAllowed').split(',');
						if(p.getAttribute('rolesAllowed'))
							rolesAllowed = p.getAttribute('rolesAllowed').split(',');
						var hold_vconf = {};
						for(var c of (p.getElementsByTagName('configuration')[0]).childNodes){
							if(c instanceof Element)
								hold_vconf[c.tagName] = c.textContent;
						}
						var confPage = new BobbleHead.PageConfiguration(hold_vconf);
						var newPage = new BobbleHead.Page(p.getAttribute('path'), //pages_path+
							parseInt(p.getAttribute('vid')),(p.getAttribute('noback')=='true'),confPage, modulesAll);
						BobbleHead.PageFactory.addPage(newPage);
					}
					BobbleHead.AppController.configuration = new BobbleHead.GenericConfiguration(hold_conf);
					var route_container = temp_configuration.getElementsByTagName('routes')[0];
					if(route_container){
						for( var r of route_container.getElementsByTagName('route')){
							this.registerRoute(new BobbleHead.Route(r.getAttribute('entry'), r.getAttribute('destination')));
						}
					}
					var module_container = temp_configuration.getElementsByTagName('modules')[0];
					var current_promise = null;
					if(module_container){
						var modules_path = module_container.getAttribute('path');
						if(!modules_path.startsWith(hold_conf.base_url))
							modules_path = BobbleHead.Util.absoluteURL(hold_conf.base_url, modules_path, false);
						var moduleConfs = {};
						for( var m of module_container.getElementsByTagName('module')){
							if(m.getAttribute('enabled') == 'true'){
								var hold_mconf = {};
								for(var c of (m.getElementsByTagName('configuration')[0]).childNodes){
									if(c instanceof Element)
										hold_mconf[c.tagName] = c.textContent;
								}
								var confModule = new BobbleHead.ModuleConfiguration(hold_mconf);
								//TODO: Replace with ES6 'import' when fully-compatible
								current_promise = new Promise(
									function(confModule, current_promise, resolve, reject){
										var mod_load_func = function(confModule, resolve){
											var script = document.createElement("script");
											script.src = modules_path + m.getAttribute('path');
											script.onload = function(modules, configuration, callback){
												while(modules.length>0){
													var sm = modules.shift();
													moduleConfs[sm.name] = configuration;
													BobbleHead.ModulePool.addModule(sm);
												}
												callback();
											}.bind(script, this.moduleOnLoad, confModule, resolve);
											document.head.appendChild(script);
										}.bind(this, confModule, resolve);
										if(current_promise!=null)
											current_promise.then(mod_load_func);
										else
											mod_load_func(confModule, resolve);
									}.bind(this, confModule, current_promise)
								);
							}
						}
					}
					var newBase = document.createElement("base");
					newBase.setAttribute("href", pages_path);
					document.getElementsByTagName("head")[0].appendChild(newBase);
					Promise.all([cacher_promise, current_promise]).then(function(){
						var globalContext = BobbleHead.Context.getGlobal();
						if(pageBuilder_conf){
							pageBuilder_conf = pageBuilder_conf.textContent;
							try{
								globalContext.pageBuilder = new (BobbleHead.Util.getClassFromName(pageBuilder_conf))();
							}catch(e){
								BobbleHead.log(e);
								globalContext.pageBuilder = new BobbleHead.PageBuilder();
							}
						}else
							globalContext.pageBuilder = new BobbleHead.PageBuilder();
						globalContext.pageBuilder.container = hold_conf.container;
						var defaultConnector_conf = (temp_configuration.getElementsByTagName('defaultConnector')[0]);
						if(defaultConnector_conf){
							defaultConnector_conf = defaultConnector_conf.textContent || 'BobbleHead.GenericConnector';
							try{
								globalContext.defaultConnector = new (BobbleHead.Util.getClassFromName(defaultConnector_conf))();
							}catch(e){
								BobbleHead.log(e);
								globalContext.defaultConnector = new BobbleHead.GenericConnector();
							}
						}else
							globalContext.defaultConnector = new BobbleHead.GenericConnector();
						var accessController_conf = (temp_configuration.getElementsByTagName('accessController')[0]);
						var accesscontroller_promise = null;
						if(accessController_conf){
							var accessController_conf_name = accessController_conf.textContent || 'BobbleHead.AccessController';
							try{
								globalContext.accessController = new (BobbleHead.Util.getClassFromName(accessController_conf_name))();
							accesscontroller_promise = globalContext.accessController.init(accessController_conf.getAttribute('method'));
							}catch(e){
								BobbleHead.log(e);
								globalContext.accessController = new BobbleHead.AccessController();
							accesscontroller_promise = globalContext.accessController.init(accessController_conf.getAttribute('method') || 'none')
							}
						}else{
							globalContext.accessController = new BobbleHead.AccessController();
							accesscontroller_promise = globalContext.accessController.init('none');
						}
						globalContext.localDatabase = BobbleHead.Database.getInstance();
						accesscontroller_promise.then(function(){
							for(var sm of BobbleHead.ModulePool.getModules()){
								var sandbox = new Sandbox(document, globalContext.clone());
								sandbox.execMethod('init', [moduleConfs[sm.name]], sm);
							}
							if(pages_index){
								hold_conf.index = parseInt(pages_index.getAttribute('vid'));
								var index_data = null;
								if(pages_index.getElementsByTagName('data')[0]){
									index_data = {};
									for(var c of (pages_index.getElementsByTagName('data')[0]).childNodes){
										if(c instanceof Element)
											index_data[c.tagName] = c.textContent;
									}
								}
								globalContext.pageBuilder.buildPage(hold_conf.index,index_data);
							}
							this.initialization = false;
						}.bind(this));
					}.bind(this));
				}catch(e){
					BobbleHead.log(e);
				}
			}
			static getConf(name){
				if(BobbleHead.AppController.configuration)
					return BobbleHead.AppController.configuration.getProperty(name);
				return null;
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
			static parseString(txt){
				var xmlDoc = null;
				if (window.DOMParser){
					var parser = BobbleHead.XMLParser.getDOMParser();
					xmlDoc = parser.parseFromString(txt, "application/xml");
				}else{
					xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = false;
					xmlDoc.loadXML(txt);
				}
				return xmlDoc;
				//return this.parseXML(xmlDoc);
			}
		},
		Context: class{
			constructor(properties = {}){
				for(var p in properties)
					this[p] = properties[p];
			}
			clone(){
				return new BobbleHead.Context(this);
			}
			static getGlobal(){
				if(!BobbleHead.Context.globalContext)
					BobbleHead.Context.globalContext = new BobbleHead.Context();
				return BobbleHead.Context.globalContext;
			}
		},
		defaultCallback: function(){
			if(arguments.length>0)
				BobbleHead.log(arguments);
		},
		Exceptions: {
			FrameworkException: class{
				constructor(message){
					this.name = 'FrameworkException';
					this.message = message;
				}
			}
		},
		FrameworkEvent: class extends Event{},
		log: function(data,level = null,description = null){
			if(level!=null && description != null){
				if(parseInt(level)>1)
					
					console.error('['+data+'] ', description);
				else
					console.log('['+data+'] ', description)
			}else
				console.log(data);
		},
		Util: {
			isRemoteURIPattern: /^http[s]?:\/\//i,
			vidInURIPattern: /^([0-9]+|back)\/?/,
			strInURIPattern: /^([\w]+)\/?/,
			getClassFromName: function(str){
				var curr = window;
				var _clss = str.split('.');
				for(var i=0; i<_clss.length; i++){
					curr = curr[_clss[i]];
				}
				return curr;
			},
			absoluteURL: function(base, relative, trailingSlash = true) {
				var stack = base.split("/"),
					parts = relative.split("/");
				if(trailingSlash)
					stack.pop(); // remove current file name (or empty string)
								 // (omit if "base" is the current folder without trailing slash)
				for (var i=0; i<parts.length; i++) {
					if (parts[i] == ".")
						continue;
					if (parts[i] == "..")
						stack.pop();
					else
						stack.push(parts[i]);
				}
				return stack.join("/");
			},
			execFuncWithArgList: function(f, args) {
				var params = [f].concat(args);
				return f.bind.apply(f, params);
			},
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
						if(this.array[i].getValue().equal(val))
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
				setValue(value){
					this.value = value;
				}
			}
		}
	}
	//static class attribute
	BobbleHead.UserPool.users = {};
	BobbleHead.RolePool.roles = {};
	BobbleHead.ModelPool.models = {};
	BobbleHead.ModulePool.modules = {};
	BobbleHead.Router.routes = [];
	BobbleHead.InternalConnector.instance = null;
	BobbleHead.ExternalConnector.instance = null;
	BobbleHead.Cacher.cacheHeap = null;
	BobbleHead.Cacher.cacheMap = null;
	BobbleHead.Cacher.whitelist = null;
	BobbleHead.Cacher.blacklist = null;
	BobbleHead.Cacher.maxCached = 1000;
	BobbleHead.Cacher.nodesPartNum = 3;
	BobbleHead.Database.instance = null;
	BobbleHead.XMLParser.domParser = null;
	BobbleHead.AppController.configuration = null;
	BobbleHead.Context.globalContext = null;
	BobbleHead.AuthenticationMethods.methods = {};
	//Library Sub-class
	BobbleHead.ModuleConfiguration = class extends BobbleHead.GenericConfiguration{};
	BobbleHead.PageConfiguration = class extends BobbleHead.GenericConfiguration{};
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
	BobbleHead.AuthenticationMethods.NoneAuthentication = class extends BobbleHead.AuthenticationMethod{};
	BobbleHead.AuthenticationMethods.addMethod('none',BobbleHead.AuthenticationMethods.NoneAuthentication);
	BobbleHead.AuthenticationMethods.BasicAuthentication = class extends BobbleHead.AuthenticationMethod{
		login(data = null){
			if(data.name && data.password){
				var user = new BobbleHead.User(data.name, data.password, ['user']);
				this.session = new BobbleHead.Session({'user': user});
			}else
				BobbleHead.log('BasicAuthentication',1,'Invalid user');
			return null;
		}
		logout(){
			this.replaceCurrentSession(null);
			return null;
		}
		processRequest(request = null){
			if(request){
				if(this.session){
					var userInfo = this.session.getInfo();
					var userObj = userInfo.user;
					request.setHeader('Authorization','Basic ' + btoa(userObj.name+':'+userObj.password));
				}
			}
		}
		processPage(page = null){
			if(page && page.roles){
				if(this.session){
					var userInfo = this.session.getInfo();
					var userObj = userInfo.user;
					var flag = false;
					for(var i=0; i<page.roles.length; i++){
						if(userObj.roles.indexOf(page.roles[i])!=-1)
							flag = true;
					}
					if(!flag){
						throw new BobbleHead.Exceptions.UnauthorizedException();
					}
				}else if(page.roles.length>0)
					throw new BobbleHead.Exceptions.UnauthorizedException();
			}
		}
	};
	BobbleHead.AuthenticationMethods.addMethod('basic',BobbleHead.AuthenticationMethods.BasicAuthentication);
	//Exception
	BobbleHead.Exceptions.PageNotFoundException = class extends BobbleHead.Exceptions.FrameworkException{};
	BobbleHead.Exceptions.NotSupportedException = class extends BobbleHead.Exceptions.FrameworkException{};
	BobbleHead.Exceptions.UnauthorizedException = class extends BobbleHead.Exceptions.FrameworkException{};
	BobbleHead.Exceptions.InvalidRouteException = class extends BobbleHead.Exceptions.FrameworkException{};
	BobbleHead.Exceptions.ControllerNotFoundException = class extends BobbleHead.Exceptions.FrameworkException{};
	BobbleHead.Exceptions.InvalidAuthenticationMethod = class extends BobbleHead.Exceptions.FrameworkException{};
	//Events
	BobbleHead.CacherLoadedEvent = class extends BobbleHead.FrameworkEvent{
		constructor(data = null){
			super('cacherloaded', data);
		}
	};
	BobbleHead.AccessControllerLoadedEvent = class extends BobbleHead.FrameworkEvent{
		constructor(data = null){
			super('acloaded', data);
		}
	};
	BobbleHead.PageReadyEvent = class extends BobbleHead.FrameworkEvent{
		constructor(data = null){
			super('pageready', data);
		}
	};
	//Main Routine
	return new BobbleHead.AppController('./app.xml');

})(window);
