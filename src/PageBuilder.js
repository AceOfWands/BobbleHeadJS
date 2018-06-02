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
import Mustache from 'mustache';
import {log, defaultCallback, isRemoteURIPattern} from './Util.js';

export default class PageBuilder{
	constructor(){
		this.pageStack = [];
		this.container = null;
		this.documentProxy = null;
		this.currentPage = null;
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
		for(var i = 100; i>=0; i--){
			newdomcontainer.style.left = i+'%';
		}
		newdomcontainer.style.position = '';
		newdomcontainer.style.float = 'none';
		document.body.removeChild(document.getElementById("snapPageIframe"));
	}
	setDefaultListener(context, container){
		if(container instanceof Element){
			if(container.tagName.toUpperCase() == 'A')
				var a = [container];
			else
				var a = container.getElementsByTagName("a");
			for(var i=0; i<a.length; i++){
				if(!a[i].hasAttribute('bbh-ignore') && !isRemoteURIPattern.test(a[i].getAttribute('href')))
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
	getNewContainer(toHistory, prevPageSrc="about:blank"){
		var domcontainer = document.getElementById(this.container);
		domcontainer.setAttribute("id", this.container+'-toDelete');
		var newdomcontainer = document.createElement("div");
		newdomcontainer.setAttribute("id", this.container);
		newdomcontainer.style.left = '100%';
		newdomcontainer.style.width = '100%';
		newdomcontainer.style.float = 'left';
		newdomcontainer.style.position = 'absolute';
		document.body.appendChild(newdomcontainer);
		var newIframe = document.createElement('iframe');
		newIframe.id = "snapPageIframe";
		newIframe.width = '100%';newIframe.height = '100%';
		newIframe.src = prevPageSrc;
		document.body.appendChild(newIframe);
		if(!toHistory)
			document.body.removeChild(domcontainer);
		else{
			var hNum = (document.querySelectorAll('*[id^="historyPage-"]').length);
			domcontainer.setAttribute('id', 'historyPage-'+hNum);
			domcontainer.style.display = 'none';
			var eleIds = domcontainer.querySelectorAll('*[id]');
			for(var i = 0; i<eleIds.length; i++){
				eleIds[i].id += '-history'+hNum;
			}
		}
		return newdomcontainer;
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
					if(!ghosting && this.currentPage.page.keepLive)
						toHistory = true;
					this.pageStack.push(this.currentPage);
				}
				if(page.lock)
					this.pageStack = [];
				var domcontainer = this.getNewContainer(toHistory, (this.currentPage) ? this.currentPage.page.path : undefined);
				var pageContx = new PageContext(domcontainer);
				this.currentPage = new VirtualPage(page, data, pageContx, resolve, reject);
				this.checkVirtualPage(this.currentPage);
				this.buildPageByObject(page, data, pageContx, resolve, reject);
				this.pageHop();
			}else
				reject(new PageNotFoundException());
		}.bind(this)).catch(function(e) {
			log(e);
		});
	}
	buildPageFromHistory(historyNum, prevPageSrc){
		var domcontainer = document.getElementById(this.container);
		domcontainer.setAttribute("id", this.container+'-toDelete');
		var newdomcontainer = document.getElementById('historyPage-'+historyNum);
		var newIframe = document.createElement('iframe');
		newIframe.id = "snapPageIframe";
		newIframe.width = '100%';newIframe.height = '100%';
		newIframe.src = prevPageSrc;
		document.body.appendChild(newIframe);
		document.body.removeChild(domcontainer);
		newdomcontainer.setAttribute('id', this.container);
		newdomcontainer.style.display = 'inline';
		var eleIds = newdomcontainer.querySelectorAll('*[id]');
		var toTrim = ('-history'+historyNum).length;
		for(var i = 0; i<eleIds.length; i++){
			eleIds[i].id = (eleIds[i].id).substring(0, (eleIds[i].id).length - toTrim);
		}
	}
	async buildPageByText(html, data, configuration, sandbox, modulesToLoad, onSuccess, onFailure){
			var context = Context.getGlobal();
			var appContainer = document.getElementById(this.container);
			appContainer.innerHTML = Mustache.render(html,
				{pageData: data, models: ModelPool.getModels(), pageConf: configuration.properties});
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
				document.dispatchEvent(new BobbleHead.PageReadyEvent());
				appContainer.dispatchEvent(new BobbleHead.PageReadyEvent());
				onSuccess();
			});
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
				this.buildPageFromHistory(hNum - 1, vpage.page.path);
				this.pageHop();
			}else{
				this.getNewContainer(false, vpage.page.path);
				this.buildPageByObject(vpage.page, vpage.data, vpage.context, vpage.success, vpage.fail);
				this.pageHop();
			}
		}else
			throw new PageNotFoundException();
	}
}