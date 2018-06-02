import Router from './Router.js';
import Context from './Context.js';
import ModulePool from './ModulePool.js';
import ControllerNotFoundException from './Exceptions/ControllerNotFoundException.js';
import {vidInURIPattern} from './Util.js';

export default class InternalConnector{
	static getInstance(){
		if(!InternalConnector.instance)
			InternalConnector.instance = new InternalConnector();
		return InternalConnector.instance;
	}
	doRequest(request){
		return new Promise(function(resolve, reject) {
			if(request.uri.startsWith('app://')){
				try{
					var uri = Router.route(request.uri);
					var subUri = uri.substring(6);
					if(subUri.startsWith('page/')){
						var num = vidInURIPattern.exec(subUri.substring(5));
						if(num){
							var vid_str = num[1];
							var context = Context.getGlobal();
							if(vid_str == 'back')
								context.pageBuilder.pageBack();
							else
								context.pageBuilder.buildPage(parseInt(vid_str),request.getDataAsObject()).then(resolve).catch(reject);
						}
					}else if(subUri.startsWith('module/')){
						var subSubUri = subUri.substring(7);
						var n = subSubUri.indexOf('/');
						var moduleName = null;
						if(n>=0)
							moduleName = subSubUri.substring(0, n);
						else
							moduleName = subSubUri;
						var module = ModulePool.getModule(moduleName);
						var subSubSubUri = subSubUri.substring(n+1);
						n = subSubSubUri.indexOf('/');
						var controllerName = null;
						if(n>=0)
							controllerName = subSubSubUri.substring(0, n);
						else
							controllerName = subSubSubUri;
						var controllr = module.getController(controllerName);
						if(controllr!=null)
							controllr(request.getData(), resolve, reject);
						else
							reject(new ControllerNotFoundException());
					}
				}catch(e){
					reject(e);
				}
			}
		});
	}
};
InternalConnector.instance = null;