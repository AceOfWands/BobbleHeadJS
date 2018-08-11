import Module from './Module.js';
import {log} from './Util.js';

export default class ModulePool{
	static *getModules(){
		for(var x in ModulePool.modules){
			if(ModulePool.modules[x] instanceof Module)
				yield ModulePool.modules[x];
		}
	}
	static getModule(name){
		return ModulePool.modules[name];
	}
	static getModulePermissions(name){
		return ModulePool.modulePerms[name];
	}
	static addModule(module, permissions){
		try{
			ModulePool.modules[module.name] = module;
			ModulePool.modulePerms[module.name] = permissions;
		}catch(e){
			log(e);
		}
	}
}
ModulePool.modules = {};
ModulePool.modulePerms = {};