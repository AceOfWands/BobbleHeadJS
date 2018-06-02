import PouchDB from 'pouchdb';

export default class Database{
	static getInstance(){
		if(Database.instance == null){
			Database.instance = new PouchDB('bobblehead');
			if (!Database.instance.adapter)
				Database.instance = new PouchDB('bobblehead');
		}
		return Database.instance;
	}
};
Database.instance = null;