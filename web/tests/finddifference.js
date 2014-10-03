"use strict";
define(
    ['QUnit', '../powergrid'],
    function(QUnit, PowerGrid) {
        QUnit.test("Test find difference", function(assert) {
            function _(i) { return { id: i }; }
            
            function test(dataset1, dataset2, message) {
                var n = new Array(dataset1.length);
                for(var x=0;x<dataset1.length;x++) n[x] = dataset1[x];
                
                var diff = PowerGrid.prototype.diff(dataset1, dataset2);
                
                diff.forEach(function(c) {
                    if(c.add) {
                        n.splice.apply(n, [c.add[0], 0].concat(dataset2.slice(c.add[0], c.add[1])));
                    } else if (c.remove) {
                        console.log("Removed", n.splice(c.remove[0],c.remove[1]-c.remove[0]));
                    }
                });
                
                assert.deepEqual(n, dataset2, dataset1.toString() + ", " + dataset2.toString());
            }
            
            var a=_('a'),b=_('b'),c=_('c'),d=_('d'),e=_('e'),f=_('f'),g=_('g'),h=_('h'),i=_('i'),j=_('j'),k=_('k');
            
            test([a,    d,e,f,g,    j,k], 
                 [a,      e,f,        k]);
            
            test([a, b,       e, f],
                 [a, b, c, d, e, f]);
            
            test([   b, c, d, e, f,    h],
                 [a, b,    d, e,    g   ]);
            
            test([a,c,e,g,i,k],
                 [b,d,f,h,j]);
            
            test([a,c,e,f,g,i,k],
                 [b,d,f,h,j]);
            
            test([a,c,e,f,g,i,k],
                 [a,b,d,f,h,j]);
            
            test([a,c,e,f,g,i,k],
                 [b,d,f,h,j,k]);
                        
            test([a,c,e,f,g,h,i,k],
                 [b,d,f,h,j,k]);
            
            test([a,c,e,f,g,h,i,j,k],
                 [b,d,f,h,j,i,k]);
            
            test([a,b,c,d,e,f,g],
                 [c,e,f,d,g,a,b]);
            
            test([   b, c, d,    f,    h],
                 [a, b,    d, e, f, g, h]);
            
            test([   b, c, d,    f,    h],
                 []);
            
            test([],
                 [   b, c, d,    f,    h]);
            
            test([a,b,c,d,e,f,g],
                 [b]);
            
            test([a,b,c,d,e,f],
                 [  b,c,d,e,f]);
            
        });
    }
);
