import {log} from './Util.js';

export default class ModelPool{
	static getModels(){
		return ModelPool.models;
	}
	static getModel(name){
		return ModelPool.models[name];
	}
	static addModel(model){
		try{
			ModelPool.models[model.name] = model;
		}catch(e){
			log(e);
		}
	}
}
ModelPool.models = {};