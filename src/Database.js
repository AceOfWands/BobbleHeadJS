import PouchDB from 'pouchdb';

export default class Database{
	static getInstance(system = false){
		if(system){
			if(Database.systemInstance == null)
				Database.systemInstance = new PouchDB('bobblehead_core', Database.configs);
			return Database.systemInstance;
		}else{
			if(Database.instance == null)
				Database.instance = new PouchDB('bobblehead', Database.configs);
			return Database.instance;
		}
	}
	static setConfigs(cnfg){
		Database.configs = cnfg;
	}
};
Database.instance = null;
Database.systemInstance = null;
Database.configs = null;