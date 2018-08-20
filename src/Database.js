import PouchDB from 'pouchdb';

export default class Database{
	static getInstance(system = false){
		if(system){
			if(Database.systemInstance == null)
				Database.systemInstance = new PouchDB('bobblehead_core');
			return Database.systemInstance;
		}else{
			if(Database.instance == null)
				Database.instance = new PouchDB('bobblehead');
			return Database.instance;
		}
	}
};
Database.instance = null;
Database.systemInstance = null;