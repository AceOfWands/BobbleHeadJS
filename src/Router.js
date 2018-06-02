import {log} from './Util.js';

export default class Router{
	static route(uri){
		var r = Router.routes;
		for(var i=0; i<r.length; i++){
			var t = r[i].route(uri);
			if(t) return t;
		}
		return uri;
	}
	static addRoute(route){
		try{
			Router.routes.push(route);
		}catch(e){
			log(e);
		}
	}
};
Router.routes = [];