export default class GenericConfiguration{
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
}