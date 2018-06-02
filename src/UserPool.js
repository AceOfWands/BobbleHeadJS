import {log} from './Util.js';

export default class UserPool{
	static getUser(username){
		return UserPool.users[username];
	}
	static addUser(user){
		try{
			UserPool.users[user.username] = user;
		}catch(e){
			log(e);
		}
	}
}
UserPool.users = {};