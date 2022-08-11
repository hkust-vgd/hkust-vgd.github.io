/**
 * Created by Desktop on 1/8/2017.
 */
class SegmentMesh{
    constructor(){}

    //universe* SegmentMesh::SegmentGraph(int   num_vertices, int   num_edges, edge *edges, float c) {
    static SegmentGraph(num_vertices, num_edges, edges, c) {
        edges.sort(function(a, b){
            return (a.w-b.w);
        });

        var u = new universe(num_vertices);

        var threshold = new Float32Array(num_vertices);

        for (var i = 0; i < num_vertices; i++)
            threshold[i] = c/1;

        for (var i = 0; i < num_edges; i++) {
            var pedge =  edges[i];

            var a = u.find(pedge.a);
            var b = u.find(pedge.b);
            if (a != b) {
                if ((pedge.w <= threshold[a]) && (pedge.w <= threshold[b])) {
                    u.join(a, b);
                    a = u.find(a);
                    threshold[a] = pedge.w + c/u.size(a);
                }
            }
        }

        return u;
    }
}

function edge(a,b,w){
    this.a = a;
    this.b = b;
    this.w = w;
}

function make_pair(a,b){
    this.first = a;
    this.second = b;
}

function uni_elt(rank, p, size){
    this.rank = rank;
    this.p = p;
    this.size = size;
}