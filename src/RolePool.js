import Role from './Role.js';

export default class RolePool{
	static getRole(name){
		if(!RolePool.roles[name])
			RolePool.roles[name] = new Role(name);
		return RolePool.roles[name];
	}
}
RolePool.roles = {};