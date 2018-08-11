import XMLParser from './XMLParser.js';
import {log, absoluteURL, getClassFromName} from './Util.js';
import ModulePool from './ModulePool.js';
import ModelPool from './ModelPool.js';
import Router from './Router.js';
import Cacher from './Cacher.js';
import PageConfiguration from './PageConfiguration.js';
import Page from './Page.js';
import PageFactory from './PageFactory.js';
import GenericConfiguration from './GenericConfiguration.js';
import Route from './Route.js';
import ModuleConfiguration from './ModuleConfiguration.js';
import Context from './Context.js';
import PageBuilder from './PageBuilder.js';
import GenericConnector from './GenericConnector.js';
import AccessController from './AccessController.js';
import NotSupportedEngineError from './Errors/NotSupportedEngineError.js';
import Database from './Database.js';
import FrameworkException from './Exceptions/FrameworkException.js';
import Sandbox from 'js-sandbox';

export default class AppController{
	constructor(xmlConfiguration){
		this.moduleOnLoad = [];
		this.initialization = true;
		XMLParser.parseUrl(xmlConfiguration,this.processConf.bind(this));
	}
	registerModel(model){
		ModelPool.addModel(model);
	}
	registerModule(module){
		if(this.initialization)
			this.moduleOnLoad.push(module);
		else
			ModulePool.addModule(module);
	}
	registerRoute(route){
		Router.addRoute(route);
	}
	addToGlobalContext(name, obj){
		var globalContext = Context.getGlobal();
		if(name in globalContext)
			throw new FrameworkException('A module tried to edit global context!');
		else
			globalContext[name] = obj;
	}
	processConf(conf){
		if(!conf) return;
		var hold_conf = {};
		try{
			var temp_configuration = conf.getElementsByTagName('configuration')[0];
			hold_conf.container = (temp_configuration.getElementsByTagName('container')[0]).textContent;
			if((temp_configuration.getElementsByTagName('base_url')).length>0)
				hold_conf.base_url = (temp_configuration.getElementsByTagName('base_url')[0]).textContent;
			else{
				var path = document.location.pathname.split('/');
				path.pop();
				hold_conf.base_url = document.location.protocol + '//' + document.location.host + path.join('/');
			}
			var pageBuilder_conf = (temp_configuration.getElementsByTagName('pageBuilder')[0]);
			var cache_whitelist = [];
			var cache_blacklist = [];
			var cache_maxcached = 1000;
			var cacher_conf = (temp_configuration.getElementsByTagName('cacher')[0]);
			if(cacher_conf){
				if(cacher_conf.getAttribute('max-cached'))
					cache_maxcached = parseInt(cacher_conf.getAttribute('max-cached'));
				if(cacher_conf.getElementsByTagName('block'))
					for( var b of cacher_conf.getElementsByTagName('block')){
						cache_blacklist.push(b.getAttribute('url'));
					}
				if(cacher_conf.getElementsByTagName('persist'))
					for( var p of cacher_conf.getElementsByTagName('persist')){
						cache_whitelist.push(p.getAttribute('url'));
					}
			}
			var cacher_promise = Cacher.init(cache_maxcached, cache_whitelist, cache_blacklist);
			var page_container = temp_configuration.getElementsByTagName('pages')[0];
			var pages_index = page_container.getElementsByTagName('index')[0];
			var pages_path = page_container.getAttribute('path');
			var pages_transition = page_container.getAttribute('transition') || null;
			for( var p of page_container.getElementsByTagName('page')){
				var modulesAll = null;
				var rolesAllowed = null;
				if(p.getAttribute('modulesAllowed'))
					modulesAll = p.getAttribute('modulesAllowed').split(',');
				if(p.getAttribute('rolesAllowed'))
					rolesAllowed = p.getAttribute('rolesAllowed').split(',');
				var hold_vconf = {};
				if(p.getElementsByTagName('configuration') && p.getElementsByTagName('configuration').length > 0)
					for(var c of (p.getElementsByTagName('configuration')[0]).childNodes){
						if(c instanceof Element)
							hold_vconf[c.tagName] = c.textContent;
					}
				var confPage = new PageConfiguration(hold_vconf);
				var newPage = new Page(p.getAttribute('path'), //pages_path+
					parseInt(p.getAttribute('vid')),(p.getAttribute('noback')=='true'),confPage, modulesAll,
					(p.hasAttribute('keepLive')) ? (p.getAttribute('keepLive')=='true') : undefined,
					(p.hasAttribute('allowDuplicate')) ? (p.getAttribute('allowDuplicate')=='true') : undefined,
					(p.hasAttribute('ghostPage')) ? (p.getAttribute('ghostPage')=='true') : undefined, rolesAllowed);
				PageFactory.addPage(newPage);
			}
			AppController.configuration = new GenericConfiguration(hold_conf);
			var route_container = temp_configuration.getElementsByTagName('routes')[0];
			if(route_container){
				for( var r of route_container.getElementsByTagName('route')){
					this.registerRoute(new Route(r.getAttribute('entry'), r.getAttribute('destination')));
				}
			}
			var module_container = temp_configuration.getElementsByTagName('modules')[0];
			var current_promise = null;
			if(module_container){
				var modules_path = module_container.getAttribute('path');
				if(!modules_path.startsWith(hold_conf.base_url))
					modules_path = absoluteURL(hold_conf.base_url, modules_path, false);
				var moduleConfs = {};
				for( var m of module_container.getElementsByTagName('module')){
					if(m.getAttribute('enabled') == 'true'){
						var hold_mconf = {};
						var modulePerm = m.getAttribute('permissions') ? m.getAttribute('permissions').split(',') : [];
						for(var c of (m.getElementsByTagName('configuration')[0]).childNodes){
							if(c instanceof Element)
								hold_mconf[c.tagName] = c.textContent;
						}
						var confModule = new ModuleConfiguration(hold_mconf);
						//TODO: Replace with ES6 'import' when fully-compatible
						current_promise = new Promise(
							function(confModule, modulePerm, current_promise, resolve, reject){
								var mod_load_func = function(confModule, modulePerm, resolve){
									var script = document.createElement("script");
									script.src = modules_path + m.getAttribute('path');
									script.type = 'module';
									script.onload = function(modules, configuration, permissions, callback){
										while(modules.length>0){
											var sm = modules.shift();
											moduleConfs[sm.name] = configuration;
											ModulePool.addModule(sm, permissions);
										}
										callback();
									}.bind(script, this.moduleOnLoad, confModule, modulePerm, resolve);
									document.head.appendChild(script);
								}.bind(this, confModule, modulePerm, resolve);
								if(current_promise!=null)
									current_promise.then(mod_load_func);
								else
									mod_load_func();
							}.bind(this, confModule, modulePerm, current_promise)
						).catch(function(e) {
							log(e);
						});
					}
				}
			}
			var newBase = document.createElement("base");
			newBase.setAttribute("href", pages_path);
			document.getElementsByTagName("head")[0].appendChild(newBase);
			Promise.all([cacher_promise, current_promise]).then(function(){
				var globalContext = Context.getGlobal();
				globalContext.BobbleHead = new Proxy(BobbleHead, {
					whiteList: [
						'User',
						'Role',
						'Session',
						'Response',
						'Request',
						'ConnectorRequest',
						'Model',
						'ModelInstance',
						'Route',
						'Page',
						'PageContext',
						'AuthenticationMethod',
						'AuthenticationMethods',
						'PageFactory',
						'VirtualPage',
						'Exceptions',
						'Errors',
						'Events',
						'Util'
					],
					get: function(target, name) {
						return (name in target && name in this.whiteList) ?
							target[name] :
							null;
					}
				});
				if(pageBuilder_conf){
					pageBuilder_conf = pageBuilder_conf.textContent;
					try{
						globalContext.pageBuilder = pageBuilder_conf ?
							new (getClassFromName(pageBuilder_conf))() :
							new PageBuilder();
					}catch(e){
						log(e);
						globalContext.pageBuilder = new PageBuilder();
					}
				}else
					globalContext.pageBuilder = new PageBuilder();
				globalContext.pageBuilder.container = hold_conf.container;
				globalContext.pageBuilder.transition = pages_transition;
				var defaultConnector_conf = (temp_configuration.getElementsByTagName('defaultConnector')[0]);
				if(defaultConnector_conf){
					defaultConnector_conf = defaultConnector_conf.textContent;
					try{
						globalContext.defaultConnector = defaultConnector_conf ?
							new (getClassFromName(defaultConnector_conf))() :
							new GenericConnector();
					}catch(e){
						log(e);
						globalContext.defaultConnector = new GenericConnector();
					}
				}else
					globalContext.defaultConnector = new GenericConnector();
				var accessController_conf = (temp_configuration.getElementsByTagName('accessController')[0]);
				var accesscontroller_promise = null;
				if(accessController_conf){
					var accessController_conf_name = accessController_conf.textContent;
					try{
						globalContext.accessController = accessController_conf_name ?
							new (getClassFromName(accessController_conf_name))():
							new AccessController();
						accesscontroller_promise = globalContext.accessController.init(accessController_conf.getAttribute('method'));
					}catch(e){
						log(e);
						globalContext.accessController = new AccessController();
						accesscontroller_promise = globalContext.accessController.init(accessController_conf.getAttribute('method') || 'none')
					}
				}else{
					globalContext.accessController = new AccessController();
					accesscontroller_promise = globalContext.accessController.init('none');
				}
				globalContext.localDatabase = Database.getInstance();
				accesscontroller_promise.then(function(){
					var otherPromises = [];
					for(var sm of ModulePool.getModules()){
						var mContext = globalContext.clone();
						var mPerms = [];
						for(var mp of ModulePool.getModulePermissions(sm.name)){
							if(mp == 'pages'){
								mPerms = mPerms.concat(['PageFactory', 'PageConfiguration']);
							}else if(mp == 'users'){
								mPerms = mPerms.concat(['UserPool', 'RolePool']);
							}else if(mp == 'models'){
								mPerms = mPerms.concat(['ModelPool']);
							}
						}
						mContext.BobbleHead = new Proxy(BobbleHead, {
							whiteList: [
								'User',
								'Role',
								'Session',
								'Response',
								'Request',
								'ConnectorRequest',
								'Model',
								'ModelInstance',
								'Route',
								'Page',
								'PageContext',
								'AuthenticationMethod',
								'AuthenticationMethods',
								'VirtualPage',
								'Exceptions',
								'Errors',
								'Events',
								'Util',
								'XMLParser'
							].concat(mPerms),
							moduleName: sm.name,
							get: function(target, name) {
								if(name in target && this.whiteList.indexOf(name)!=-1)
									return target[name];
								else
									throw new FrameworkException('Unpermitted access to '+name+' from '+this.moduleName);
							}
						});
						var sandbox = new Sandbox(document.getElementById(hold_conf.container), mContext);
						var initReturn = sandbox.execMethod('init', [moduleConfs[sm.name]], sm);
						if(initReturn instanceof Promise)
							otherPromises.push(initReturn);
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
						Promise.all(otherPromises).then(function(index,index_data){
							this.pageBuilder.buildPage(index,index_data);
						}.bind(globalContext,hold_conf.index,index_data));
					}
					this.initialization = false;
				}.bind(this));
			}.bind(this));
		}catch(e){
			log(e);
			throw new NotSupportedEngineError();
		}
	}
	static getConf(name){
		if(AppController.configuration)
			return AppController.configuration.getProperty(name);
		return null;
	}
};
AppController.configuration = null;