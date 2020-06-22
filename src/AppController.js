import XMLParser from './XMLParser.js';
import {log, absoluteURL, getClassFromName, convertDomToMap} from './Util.js';
import ModulePool from './ModulePool.js';
import ModelPool from './ModelPool.js';
import Router from './Router.js';
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
import Environment from './Util/Dom/Environment.js';
import SafeBobbleHead from './SafeBobbleHead.js';
import ExtendedDomElement from './Util/Dom/ExtendedDomElement.js';

export default class AppController{

	static getInstance(xmlConfiguration = null){
		if(!AppController.instance)
			AppController.instance = new AppController(xmlConfiguration);
		else if(xmlConfiguration != null)
			throw new FrameworkException("An instance of BobbleHead is already running");

		return AppController.instance;
	}

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

	getClassFromApplicationContext(classPath, environments){
		let globalObject = getClassFromName(classPath, window);

		if(globalObject) return globalObject;

		for(let environment of environments){
			let environmentObject = environment.getExposed(classPath);
			if(environmentObject) return environmentObject;
		}
		
		throw new FrameworkException(
			`${classPath} isn't exposed on global or module context`
		);
	}

	processConf(appConfiguration){
		if(!appConfiguration) return;
		var coreProperties = {};
		try{
			var configuration = new ExtendedDomElement(
					appConfiguration.getElementsByTagName('configuration')[0]
				);

			coreProperties.container = (
					configuration.getFirstElementByTagName('container')
				).textContent;

			if(configuration.existsElementByTagName('base_url'))
				coreProperties.base_url = configuration.getFirstElementByTagName('base_url')
											.textContent;
			else{
				var currentPathSplitted = document.location.pathname.split('/');
				currentPathSplitted.pop();
				coreProperties.base_url = `${document.location.protocol}//${document.location.host +
					currentPathSplitted.join('/')}`;
			}

			var pageBuilderConfiguration = configuration.getFirstElementByTagName('pageBuilder');

			var databaseConfiguration = configuration.getFirstElementByTagName('database');
			if(databaseConfiguration){
				var databaseConfigurationMap = {};
				if(databaseConfiguration.getAttribute('revs-limit'))
					databaseConfigurationMap.revs_limit = parseInt(
							databaseConfiguration.getAttribute('revs-limit')
						);

				if(databaseConfiguration.getAttribute('compaction'))
					databaseConfigurationMap.auto_compaction = 
						databaseConfiguration.getAttribute('compaction') == 'true';

				Database.setConfigs(databaseConfigurationMap);
			}

			var page_container = configuration.getFirstElementByTagName('pages');
			var pages_index = page_container.getFirstElementByTagName('index');
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
				if(p.getElementsByTagName('configuration') &&
					p.existsElementByTagName('configuration'))
					for(var c of p.getFirstElementByTagName('configuration').childNodes){
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
			AppController.configuration = new GenericConfiguration(coreProperties);
			var route_container = configuration.getFirstElementByTagName('routes');
			if(route_container){
				for( var r of route_container.getElementsByTagName('route')){
					this.registerRoute(new Route(r.getAttribute('entry'), r.getAttribute('destination')));
				}
			}

			var module_container = configuration.getFirstElementByTagName('modules');
			var modulesPath = module_container.getAttribute('path');
				if(!modulesPath.startsWith(coreProperties.base_url))
					modulesPath = absoluteURL(coreProperties.base_url, modulesPath, false);
			var currentPromise = Promise.resolve();
			let environments = [];
			let modulesConfigurations = {};

			if(module_container){

				for( let module of module_container.getElementsByTagName('module')){
					if(module.getAttribute('enabled') == 'true'){

						let newEnvironment = new Environment(
							document,
							document.getElementById(coreProperties.container),
							coreProperties.base_url+'/'+pages_path,
							module.getAttribute('permissions') ?
								module.getAttribute('permissions').split(',') :
								[]
						);

						currentPromise = currentPromise.then(async function(){
							await newEnvironment.addFile(module.getAttribute('path'), modulesPath)
								.then(function(){
									while(this.moduleOnLoad.length>0){
										var extractedModule = this.moduleOnLoad.shift();

										let moduleConfigurationMap = convertDomToMap(
											module.getElementsByTagName('configuration')[0]
										);
										var moduleConfiguration = new ModuleConfiguration(
												moduleConfigurationMap
											);
										modulesConfigurations[extractedModule.name] = 
											moduleConfiguration;
										
										let modulePermissions = module.getAttribute('permissions') ?
											module.getAttribute('permissions').split(',') :
											[];

										ModulePool.addModule(extractedModule, modulePermissions);
									}
								}.bind(this));
						}.bind(this));

						environments.push(newEnvironment);
					}
				}
			}

			let newBase = document.createElement("base");
			newBase.setAttribute("href", pages_path);
			document.getElementsByTagName("head")[0].appendChild(newBase);
			currentPromise.then(function(){
				let globalContext = Context.getGlobal();
				globalContext.BobbleHead = new SafeBobbleHead();

				if(pageBuilderConfiguration){
					pageBuilderConfiguration = pageBuilderConfiguration.textContent;
					if(pageBuilderConfiguration){
						var pageBuildClass = this.getClassFromApplicationContext(
								pageBuilderConfiguration,
								environments
							);

						globalContext.pageBuilder = new (pageBuildClass)();
					}else
						globalContext.pageBuilder = new PageBuilder();
				}else
					globalContext.pageBuilder = new PageBuilder();
				globalContext.pageBuilder.container = coreProperties.container;
				globalContext.pageBuilder.transition = pages_transition;

				var defaultConnector_conf = (
						configuration.getFirstElementByTagName('defaultConnector')
					);
				if(defaultConnector_conf){
					defaultConnector_conf = defaultConnector_conf.textContent;
					if(defaultConnector_conf){
						var defConnClass = this.getClassFromApplicationContext(
								defaultConnector_conf,
								environments
							);
						
						globalContext.defaultConnector = new (defConnClass)();
					}else
						globalContext.defaultConnector = new GenericConnector();

				}else
					globalContext.defaultConnector = new GenericConnector();

				var accessController_conf =
					configuration.getFirstElementByTagName('accessController');

				var accesscontroller_promise = null;
				if(accessController_conf){
					var accessController_conf_name = accessController_conf.textContent;

					if(accessController_conf_name){
						var accessControllerClass = this.getClassFromApplicationContext(
								accessController_conf_name,
								environments
							);

						globalContext.accessController = new (accessControllerClass)();
						
					}else
						globalContext.accessController = new AccessController();

					accesscontroller_promise = globalContext.accessController.init(accessController_conf.getAttribute('method') || 'none');

				}else{
					globalContext.accessController = new AccessController();
					accesscontroller_promise = globalContext.accessController.init('none');
				}
				globalContext.localDatabase = Database.getInstance();
				accesscontroller_promise.then(function(){
					var otherPromises = [];
					for(var sm of ModulePool.getModules()){
						var mContext = globalContext.clone();
						mContext.BobbleHead = new SafeBobbleHead(ModulePool.getModulePermissions(sm.name));
						var sandbox = new Sandbox(document.getElementById(coreProperties.container), mContext);
						var initReturn = sandbox.execMethod('init', [modulesConfigurations[sm.name]], sm);
						if(initReturn instanceof Promise)
							otherPromises.push(initReturn);
					}
					if(pages_index){
						coreProperties.index = parseInt(pages_index.getAttribute('vid'));
						var index_data = null;
						if(pages_index.getFirstElementByTagName('data')){
							index_data = {};
							for(var c of pages_index.getFirstElementByTagName('data').childNodes){
								if(c instanceof Element)
									index_data[c.tagName] = c.textContent;
							}
						}
						Promise.all(otherPromises).then(function(index,index_data){
							this.pageBuilder.buildPage(index,index_data);
						}.bind(globalContext,coreProperties.index,index_data));
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
AppController.instance = null;