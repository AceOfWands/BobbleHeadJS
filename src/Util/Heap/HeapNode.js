export default class HeapNode{
	constructor(key,value){
		this.key = key;
		this.value = value;
	}
	getKey(){
		return this.key;
	}
	incKey(){
		this.key++;
	}
	decKey(){
		this.key--;
	}
	increaseKey(i){
		this.key += i;
	}
	reduceKey(i){
		this.key -= i;
	}
	getValue(){
		return this.value;
	}
	setValue(value){
		this.value = value;
	}
}