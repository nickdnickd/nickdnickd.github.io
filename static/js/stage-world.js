(function (scope) {
  'use strict';
  const gate = {x:8,y:5}, plate = {x:6,y:8};
  const same = (a,b) => a.x===b.x && a.y===b.y;
  function create() {
    let player, box, history, reached;
    function reset(){player={x:6,y:11};box={x:4,y:9};history=[];reached=false;}
    reset();
    const open=()=>same(player,plate)||same(box,plate)||same(player,gate)||same(box,gate);
    const blocked=p=>p.x<1||p.x>10||p.y<3||p.y>12||(p.y===5&&(p.x!==gate.x||!open()));
    return {
      reset,
      snapshot:()=>({player:{...player},box:{...box},open:open(),reached,canUndo:history.length>0}),
      move(dx,dy){
        if(Math.abs(dx)+Math.abs(dy)!==1)return false;
        const next={x:player.x+dx,y:player.y+dy};if(blocked(next))return false;
        const pushing=same(next,box),beyond={x:box.x+dx,y:box.y+dy};
        if(pushing&&blocked(beyond))return false;
        history.push({player:{...player},box:{...box},reached});
        if(history.length>500)history.shift();
        player=next;if(pushing)box=beyond;if(player.y<=3)reached=true;
        return true;
      },
      undo(){const prior=history.pop();if(!prior)return false;({player,box,reached}=prior);return true;}
    };
  }
  const api={create,gate,plate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else scope.StageWorld=api;
})(globalThis);
