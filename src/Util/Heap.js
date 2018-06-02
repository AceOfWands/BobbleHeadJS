export default class Heap{
	constructor(unorderedArray = null){
		if(unorderedArray)
			this.build(unorderedArray);
		else
			this.array = [];
	}
	sx(i){
		return 2*i;
	}
	dx(i){
		return (2*i)+1;
	}
	father(i){
		return parseInt(i/2);
	}
	heapify(i){
		var l = this.sx(i);
		var r = this.dx(i);
		var m = i;
		if(l<this.array.length && this.array[l].getKey() > this.array[i].getKey())
			m = l;
		if(r<this.array.length && this.array[r].getKey() > this.array[m].getKey())
			m = r;
		if(m != i){
			var h = this.array[i];
			this.array[i] = this.array[m];
			this.array[m] = h;
			this.heapify(m);
		}
	}
	build(unorderedArray){
		this.array = unorderedArray;
		this.reheap();
	}
	reheap(){
		for(var i = parseInt(this.array.length/2); i>=0; i--)
			this.heapify(i);
	}
	addNode(node){
		this.array.push(node);
		this.reheap();
	}
	pop(){
		if(this.array.length==0) return null;
		var r = this.array[0];
		this.array[0] = this.array[this.array.length - 1];
		this.array.length = this.array.length - 1;
		this.heapify(0);
		return r;
	}
	getFirst(){
		if(this.array.length==0) return null;
		return this.array[0];
	}
	findByValue(val){
		return new Promise(function(resolve, reject){
			for(var i=0, l=this.array.length; i<l; i++){
				var res = this.array[i].getValue().equal(val);
				if(res === true)
					resolve(this.array[i]);
				if(res instanceof Promise)
					res.then(function(ele, callback, negate, result){
						if(res === true)
							callback(ele);
						if(res === false)
							negate();
						if(res instanceof Array)
							for(var i=0; i<res.length; i++)
								if(res[i] === false)
									negate();
						callback(ele);
					}.bind(this, this.array[i], resolve, reject));
			}
			reject();
		}.bind(this));
	}
	*getNodes(){
		for(var i=0, l=this.array.length; i<l; i++)
			yield this.array[i];
	}
}