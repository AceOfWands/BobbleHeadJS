export default class Context{
	constructor(properties = {}){
		for(var p in properties)
			this[p] = properties[p];
	}
	clone(){
		return new Context(this);
	}
	static getGlobal(){
		if(!Context.globalContext)
			Context.globalContext = new Context();
		return Context.globalContext;
	}
}
Context.globalContext = null;