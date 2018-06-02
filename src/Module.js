export default class Module{
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
}