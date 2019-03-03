import Context from './Context.js';
import ConnectorRequest from './ConnectorRequest.js';
import PageFactory from './PageFactory.js';
import PageContext from './PageContext.js';
import VirtualPage from './VirtualPage.js';
import ModelPool from './ModelPool.js';
import ModulePool from './ModulePool.js';
import PageNotFoundException from './Exceptions/PageNotFoundException.js';
import RedirectException from './Exceptions/RedirectException.js';
import FrameworkException from './Exceptions/FrameworkException.js';
import ModelNotFoundException from './Exceptions/ModelNotFoundException.js';
import PageReadyEvent from './Events/PageReadyEvent.js';
import Mustache from 'mustache';
import {log, defaultCallback, isRemoteURIPattern} from './Util.js';
import './Style/Pages.css';
import Sandbox from 'js-sandbox';

export default class PageBuilder{
	constructor(){
		this.pageStack = [];
		this.container = null;
		this.documentProxy = null;
		this.currentPage = null;
		this.transition = null;
		this.timers = {
			timeouts: [],
			intervals: [],
			stack: []
		};
		(function(Node) {
			Node.prototype.__addEventListener = Node.prototype.addEventListener;
			Node.prototype.addEventListener = function addEventListener(types, listener, useCapture) {
				if(this != document){
					if(!this.__listners)
						this.__listners = {};
					types.split(' ').forEach(function(listener, useCapture, type) {
						if(!this.__listners[type])
							this.__listners[type] = [];
						this.__listners[type].push({ls: listener, uc: useCapture});
					}.bind(this, listener, useCapture));
				}
				return this.__addEventListener(types, listener, useCapture);
			};
			Node.prototype.__removeEventListener = Node.prototype.removeEventListener;
			Node.prototype.removeEventListener = function removeEventListener(types, listener, useCaptureOptions = false) {
				if(this.__listners){
					types.split(' ').forEach(function(listener, useCaptureOptions, type) {
						if(this.__listners && this.__listners[type]){
							var l = this.__listners[type].length;
							for(var i=0; i<l; i++){
								var ele = this.__listners[type].shift();
								if(ele.ls == listener && ele.uc == useCaptureOptions){
									break;
								}
								this.__listners[type].push(ele);
							}
						}
					}.bind(this, listener, useCaptureOptions));
				}
				return this.__removeEventListener(types, listener, useCaptureOptions);
			};
			Node.prototype.__renewListeners = function __renewListeners(){
				if (this.hasChildNodes()) {
					var children = this.childNodes;
					for (var i = 0; i < children.length; i++) {
						children[i].__renewListeners();
					}
				}
				if(this.__listners){
					for(var type in this.__listners){
						for(var j=0; j<this.__listners[type].length; j++)
							this.__addEventListener(type, this.__listners[type][j].ls, this.__listners[type][j].uc);
					}
				}
			};
		})(window.Node);
		(function(w, o) {
			w.__setTimeout = w.setTimeout;
			w.setTimeout = function setTimeout(){
				var id = w.__setTimeout(...arguments);
				if(id)
					o.timers.timeouts.push([id,arguments,Date.now()+(arguments.length>1 ? arguments[1] : 0)]);
				return id;
			};
			w.__setInterval = w.setInterval;
			w.setInterval = function setInterval(){
				var id = w.__setInterval(...arguments);
				if(id)
					o.timers.intervals.push([id,arguments]);
				return id;
			};
		})(window, this);
	}
	checkPage(page){
		var context = Context.getGlobal();
		context.accessController.processPage(page);
	}
	checkVirtualPage(vpage){
		var context = Context.getGlobal();
		context.accessController.processVirtualPage(vpage);
	}
	pageHop(){
		var newdomcontainer = document.getElementById(this.container);
		newdomcontainer.classList.remove('bbh-new');
	}
	setDefaultListener(context, container){
		if(container instanceof Element){
			if(container.tagName.toUpperCase() == 'A')
				var a = [container];
			else
				var a = container.getElementsByTagName("a");
			for(var i=0; i<a.length; i++){
				if(!a[i].hasAttribute('bbh-ignore') &&
					a[i].getAttribute('href') &&
					a[i].getAttribute('href')!='#' &&
					!isRemoteURIPattern.test(a[i].getAttribute('href')))
					a[i].onclick = function(connector){
						var req = new ConnectorRequest('GET', this.getAttribute('href'), null); //TODO: data-*
						connector.request(req);
						return false;
					}.bind(a[i],context.defaultConnector);
			}
			if(container.tagName.toUpperCase() == 'FORM')
				var f = [container];
			else
				var f = container.getElementsByTagName("form");
			for(var i=0; i<f.length; i++){
				if(!f[i].hasAttribute('bbh-ignore')){
					f[i].onsubmit = function(connector){
						for(var e of this.querySelectorAll('[name]')){
							if(!e.checkValidity()){
								e.reportValidity();
								return;
							}
						}
						var data = new FormData(this);
						var req = new ConnectorRequest(this.getAttribute('method'), this.getAttribute('action'), data);
						connector.request(req);
						return false;
					}.bind(f[i],context.defaultConnector);
				}
			}
		}
	}
	resumeTimers(){
		var [touts,ints] = this.timers.stack.pop();
		for(var ts of touts){
			var args = ts[0];
			args[1] = ts[1];
			setTimeout(...args);
		}
		for(var args of ints){
			setInterval(...args);
		}
	}
	pauseTimers(){
		var touts = [];
		while(this.timers.timeouts.length>0){
			var t = this.timers.timeouts.pop();
			var rest = Date.now() - t[2];
			if(rest < 0){
				touts.push([t[1],-1*rest]);
				this.clearTimer(PageBuilder.Timers.TIMEOUT, t[0]);
			}
		}
		var ints = [];
		while(this.timers.intervals.length>0){
			var t = this.timers.intervals.pop();
			ints.push(t[1]);
			this.clearTimer(PageBuilder.Timers.INTERVAL, t[0]);
		}
		this.timers.stack.push([touts,ints]);
	}
	clearTimers(){
		while(this.timers.timeouts.length>0){
			var t = this.timers.timeouts.pop();
			this.clearTimer(PageBuilder.Timers.TIMEOUT, t[0]);
		}
		while(this.timers.intervals.length>0){
			var t = this.timers.intervals.pop();
			this.clearTimer(PageBuilder.Timers.INTERVAL, t[0]);
		}
	}
	clearTimer(type, id){
		if(PageBuilder.Timers.TIMEOUT === type)
			clearTimeout(id);
		else if(PageBuilder.Timers.INTERVAL === type)
			clearInterval(id);
	}
	makeTransition(domcontainer, newdomcontainer, transition){
		var erase_prom = null;
		if(transition == 'vanish'){
			newdomcontainer.classList.add('bbh-vanish');
			newdomcontainer.classList.add('bbh-hide');
			window.getComputedStyle(newdomcontainer).opacity;
			erase_prom = new Promise(function(resolve, reject){
				domcontainer.classList.add('bbh-vanish');
				window.getComputedStyle(domcontainer).opacity;
				domcontainer.addEventListener("transitionend",
					transitionend_func = (() => {
						domcontainer.removeEventListener("transitionend",transitionend_func);
						resolve();
					})
				);
				domcontainer.classList.add('bbh-hide');
				var transitionend_func = null;
			});
		}else if(transition == 'slide'){
			domcontainer.classList.add('bbh-slide-under');
			newdomcontainer.classList.remove('bbh-slide-under');
			newdomcontainer.classList.add('bbh-slide');
			newdomcontainer.classList.add('bbh-hide');
			newdomcontainer.style.display = 'block';
			window.getComputedStyle(domcontainer).height;
			erase_prom = new Promise(function(resolve, reject){
				var transitionend_func = null;
				newdomcontainer.addEventListener("transitionend",
					transitionend_func = (() => {
						newdomcontainer.removeEventListener("transitionend",transitionend_func);
						newdomcontainer.classList.remove('bbh-slide');
						resolve();
					})
				);
				newdomcontainer.classList.remove('bbh-hide');
			});
		}
		var pagehop_ready_func = null;
		newdomcontainer.addEventListener("pageready",
			pagehop_ready_func = function(){
				if(transition == 'vanish'){
					newdomcontainer.classList.remove('bbh-hide');
				}
				newdomcontainer.removeEventListener("pageready", pagehop_ready_func);
			}
		);
		return erase_prom;
	}
	waitNremove(promise, toRemove){
		if(promise){
			var eleIds = toRemove.querySelectorAll('*[id]');
			for(var i = 0; i<eleIds.length; i++){
				eleIds[i].id += '-toDelete';
			}
			promise = promise.then(function(){
				document.body.removeChild(toRemove);
			}).catch(function(){
				document.body.removeChild(toRemove);
			});
		}else
			document.body.removeChild(toRemove);
		return promise;
	}
	getNewContainer(toHistory){
		var domcontainer = document.getElementById(this.container);
		domcontainer.setAttribute("id", this.container+'-toDelete');
		var newdomcontainer = document.createElement("div");
		newdomcontainer.setAttribute("id", this.container);
		newdomcontainer.classList.add('bbh-page');
		newdomcontainer.classList.add('bbh-new');
		document.body.appendChild(newdomcontainer);
		var erase_prom = this.makeTransition(domcontainer, newdomcontainer, this.transition);
		if(!toHistory){
			this.waitNremove(erase_prom, domcontainer);
		}else{
			var moveToHistory_func = function(){
				var hNum = (document.querySelectorAll('*[id^="historyPage-"]').length);
				domcontainer.setAttribute('id', 'historyPage-'+hNum);
				domcontainer.style.display = 'none';
				var eleIds = domcontainer.querySelectorAll('*[id]');
				for(var i = 0; i<eleIds.length; i++){
					eleIds[i].id += '-history'+hNum;
				}
			}
			if(erase_prom)
				erase_prom = erase_prom.then(moveToHistory_func);
			else
				moveToHistory_func();
		}
		if(!erase_prom)
			return newdomcontainer;
		else
			return erase_prom.then(() => {return newdomcontainer});
	}
	buildPage(virtualID, data){
		return new Promise(function(resolve, reject) {
			var page = PageFactory.getPage(virtualID);
			if(page){
				var toHistory = false;
				var ghosting = false;
				if(this.currentPage && this.currentPage.page.ghostPage){
					this.currentPage = this.pageStack.pop() || null;
					ghosting = true;
				}
				if(!page.lock && this.currentPage!=null && (page.vid != this.currentPage.page.vid || page.allowDuplicate)){
					if(!ghosting && this.currentPage.page.keepLive){
						toHistory = true;
						this.pauseTimers();
					}else
						this.clearTimers();
					this.pageStack.push(this.currentPage);
				}
				if(page.lock)
					this.pageStack = [];
				var domcontainer = this.getNewContainer(toHistory);
				var pageBuild_mainFunc = function(domcontainer){
					var pageContx = new PageContext(domcontainer);
					this.currentPage = new VirtualPage(page, data, pageContx, resolve, reject);
					this.checkVirtualPage(this.currentPage);
					this.buildPageByObject(page, data, pageContx, resolve, reject);
					this.pageHop();
				}.bind(this);
				if(domcontainer instanceof Promise)
					domcontainer.then(pageBuild_mainFunc);
				else
					pageBuild_mainFunc(domcontainer);
			}else
				reject(new PageNotFoundException());
		}.bind(this)).catch(function(e) {
			log(e);
		});
	}
	buildPageFromHistory(historyNum){
		var domcontainer = document.getElementById(this.container);
		domcontainer.setAttribute("id", this.container+'-toDelete');
		var newdomcontainer = document.getElementById('historyPage-'+historyNum);
		newdomcontainer.classList.add('bbh-new');
		var promise = this.waitNremove(this.makeTransition(domcontainer, newdomcontainer, this.transition), domcontainer);
		var recoverPage_func = function(){
			newdomcontainer.setAttribute('id', this.container);
			newdomcontainer.style.display = 'block';
			var eleIds = newdomcontainer.querySelectorAll('*[id]');
			var toTrim = ('-history'+historyNum).length;
			for(var i = 0; i<eleIds.length; i++){
				eleIds[i].id = (eleIds[i].id).substring(0, (eleIds[i].id).length - toTrim);
				eleIds[i].__renewListeners();
			}
			document.dispatchEvent(new PageReadyEvent());
			newdomcontainer.dispatchEvent(new PageReadyEvent());
		}.bind(this);
		if(promise)
			return promise.then(recoverPage_func);
		else
			recoverPage_func();
		return null;
	}
	buildPageByText(html, data, configuration, sandbox, modulesToLoad, onSuccess, onFailure){
			var context = Context.getGlobal();
			var appContainer = document.getElementById(this.container);
			var tks_queue = [];
			for(var tks of Mustache.parse(html))
				if(tks[0]!='text')
					tks_queue.push(tks);
			var wait_list = [];
			var actual_models = ModelPool.getModels();
			while(tks_queue.length>0){
				var tks = tks_queue.shift();
				if(tks[4] instanceof Array)
					for(var _tks of tks[4])
						if(_tks[0]!='text' && _tks[0]!='name')
							tks_queue.push(_tks);
				if(tks[1].startsWith('models.')){
					var model = tks[1].split('.');
					if(!actual_models[model[1]])
						throw new ModelNotFoundException(model[1]);
					try{
						var model_fetch = sandbox.execMethod('fetch', [model[2]], actual_models[model[1]]);
						if(model_fetch instanceof Promise)
							wait_list.push(model_fetch);
					}catch(e){
						throw new FrameworkException('Invalid access to models by Mustache on page.');
					}
				}
			}
			Promise.all(wait_list).then(async function(){
				appContainer.innerHTML = Mustache.render(html,
					{pageData: data, models: actual_models, pageConf: configuration.properties});
				var observer = new MutationObserver(function(context, mutationsList){
					for(var mutation of mutationsList) {
						if (mutation.type == 'childList') {
							for(var x of mutation.addedNodes){
								this.setDefaultListener(context, x);
							}
						}
					}
				}.bind(this,context));
				observer.observe(appContainer, { subtree: true, childList: true });
				
				var js = appContainer.getElementsByTagName("script");
				var lastscript = null;
				for(var i=0; i<js.length; i++){
					var nsync = js[i].getAttribute('async');
					if(js[i].getAttribute('src')!="" && js[i].getAttribute('src')!=null){
						var scriptfile = js[i].getAttribute('src');
						if(nsync != 'true' && lastscript != null)
							await lastscript;
						var scriptprom = new Promise(function(resolve, reject){
							var xhttp2 = new XMLHttpRequest();
							xhttp2.open('get', scriptfile, true);
							xhttp2.responseType = 'text';
							xhttp2.onreadystatechange = function(sandbox,sf){
								if(xhttp2.readyState === XMLHttpRequest.DONE){
									try{
										sandbox.execCode(xhttp2.response);
									}catch(e){
										log('Execution of scriptfile: '+sf, 3, e);
									}
									resolve();
								}
							}.bind(this,sandbox,scriptfile);
							xhttp2.send();
						}).catch(function(e) {
							log(e);
						});
						if(nsync != 'true')
							lastscript = scriptprom;
					}else{
						try{
							sandbox.execCode(js[i].innerHTML);
						}catch(e){
							log('Execution of script code', 3, e);
						}
					}
						
				}
				this.setDefaultListener(context, appContainer);
				var pageloadpromises = (lastscript == null) ? [] : [lastscript];
				for(var mod of ModulePool.getModules()){
					if(modulesToLoad != null && modulesToLoad.indexOf(mod.name)>-1)
						for(var e of appContainer.querySelectorAll('[bbh-module*="'+mod.name+'"]')){
							e.setAttribute('bbh-manipulating','true');
							var sand = new Sandbox(e, context.clone());
							var modpromise = sand.execMethod('manipulate', [], mod);
							if(modpromise !== undefined)
								if(modpromise instanceof Promise)
									modpromise.then(function(){
										e.setAttribute('bbh-manipulating','false');
									});
								else
									throw new FrameworkException(mod.name+' manipulate has not returned a promise');
							else
								e.setAttribute('bbh-manipulating','false');
							pageloadpromises.push(modpromise);
						}
				}
				Promise.all(pageloadpromises).then(function(){
					document.dispatchEvent(new PageReadyEvent());
					appContainer.dispatchEvent(new PageReadyEvent());
					onSuccess();
				});
			}.bind(this));
	}
	buildPageByObject(page, data, pageContext, onSuccess = defaultCallback, onFailure = defaultCallback){
		try{
			this.checkPage(page);
			var xhttp = new XMLHttpRequest();
			xhttp.open("GET", page.path, true);
			xhttp.onreadystatechange = async function(data, configuration, sandbox, modulesToLoad, onSuccess, onFailure){
				if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 404)
					onFailure(new PageNotFoundException());
				else if(xhttp.readyState === XMLHttpRequest.DONE){
					this.buildPageByText(xhttp.response, data, configuration, sandbox, modulesToLoad, onSuccess, onFailure);
				}
			}.bind(this, data, page.configuration, pageContext, page.modules, onSuccess, onFailure);
			xhttp.send(null);
		}catch(e){
			onFailure(e);
			if(e instanceof RedirectException)
				if(e.vid == -1)
					this.pageBack();
				else
					this.buildPage(e.vid, e.data);
		}
	}
	pageBack(){
		var vpage = this.pageStack.pop();
		if(vpage){
			this.currentPage = vpage;
			this.checkVirtualPage(vpage);
			if(vpage.page.keepLive){
				var hNum = (document.querySelectorAll('*[id^="historyPage-"]').length);
				var buildResult = this.buildPageFromHistory(hNum - 1, vpage.page.path);
				if(buildResult){
					buildResult.then(function(){this.pageHop()}.bind(this));
				}
				this.resumeTimers();
			}else{
				this.clearTimers();
				this.getNewContainer(false);
				var pageBuild_mainFunc = function(){
					this.buildPageByObject(vpage.page, vpage.data, vpage.context, vpage.success, vpage.fail);
					this.pageHop();
				}.bind(this);
				if(domcontainer instanceof Promise)
					domcontainer.then(pageBuild_mainFunc);
				else
					pageBuild_mainFunc();
			}
		}else
			throw new PageNotFoundException();
	}
}
PageBuilder.Timers = {};
PageBuilder.Timers.TIMEOUT = 0;
PageBuilder.Timers.INTERVAL = 1;