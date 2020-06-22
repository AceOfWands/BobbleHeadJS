import Heap from './Heap.js';

export default class ReverseHeap extends Heap {
	heapify(i){
		var l = this.sx(i);
		var r = this.dx(i);
		var m = i;
		if(l<this.array.length && this.array[l].getKey() < this.array[i].getKey())
			m = l;
		if(r<this.array.length && this.array[r].getKey() < this.array[m].getKey())
			m = r;
		if(m != i){
			var h = this.array[i];
			this.array[i] = this.array[m];
			this.array[m] = h;
			this.heapify(m);
		}
	}
}