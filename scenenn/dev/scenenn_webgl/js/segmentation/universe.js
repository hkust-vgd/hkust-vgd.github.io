/**
 * Created by Desktop on 1/8/2017.
 */
class universe {
    constructor(elements) {
        this.elts = [];
        this.num = elements;
        var item
        for (let i = 0; i < elements; i++) {
            item = new uni_elt(0,i,1);
            this.elts.push(item);
        }
    }

    find(x) {
        var y = x;
        while (y != parseInt(this.elts[y].p))
            y = this.elts[y].p;
        this.elts[x].p = y;
        return y;
    }

    join(x, y) {
        if (this.elts[x].rank > this.elts[y].rank) {
            this.elts[y].p = x;
            this.elts[x].size += this.elts[y].size;
        } else {
            this.elts[x].p = y;
            this.elts[y].size += this.elts[x].size;
            if (this.elts[x].rank == this.elts[y].rank)
                this.elts[y].rank++;
        }
        this.num = this.num - 1;
    }

    size(x) {
        return this.elts[x].size;
    }
};