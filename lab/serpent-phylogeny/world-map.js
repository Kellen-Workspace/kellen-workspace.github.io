/* 手绘世界底图：所有闭合陆地轮廓合计固定为 1000 个 SVG 节点。 */
(function(){
  const CONTROL_PATHS=[
    [[28,112],[42,88],[72,70],[96,52],[132,42],[170,46],[202,58],[226,78],[238,101],[232,121],[252,139],[246,158],[225,173],[218,194],[206,214],[190,207],[177,188],[158,184],[141,197],[119,187],[108,172],[84,168],[62,153],[43,143]],
    [[190,207],[207,214],[219,229],[213,242],[198,236],[187,222]],
    [[213,238],[239,230],[263,242],[281,262],[293,289],[301,318],[296,345],[286,370],[277,401],[260,432],[247,458],[232,439],[223,409],[214,384],[208,354],[197,329],[193,298],[199,271]],
    [[408,111],[421,94],[438,91],[447,75],[465,82],[477,68],[499,65],[515,48],[539,48],[557,58],[582,59],[600,68],[624,62],[649,67],[674,58],[704,55],[732,47],[760,56],[786,68],[817,73],[841,87],[870,91],[894,108],[919,128],[936,149],[928,166],[910,177],[883,174],[866,188],[842,192],[820,183],[798,195],[779,211],[759,207],[744,226],[730,247],[712,254],[699,236],[681,226],[670,207],[653,197],[638,181],[617,179],[599,168],[579,174],[560,184],[544,177],[526,188],[507,180],[492,166],[473,174],[456,164],[438,170],[424,152]],
    [[454,181],[479,177],[504,184],[530,183],[551,196],[571,218],[585,244],[583,272],[574,297],[566,326],[549,350],[535,378],[516,401],[496,386],[485,364],[470,345],[461,318],[451,295],[445,266],[449,236],[440,212]],
    [[640,185],[650,203],[664,218],[673,239],[666,263],[654,252],[648,228],[635,207]],
    [[704,221],[716,231],[728,249],[739,260],[735,276],[722,268],[713,250],[701,241]],
    [[777,325],[797,311],[822,308],[842,297],[866,303],[883,314],[906,316],[925,335],[929,357],[919,379],[897,392],[876,406],[850,402],[831,394],[809,385],[792,367],[783,348]],
    [[342,89],[354,70],[374,61],[397,69],[414,87],[420,106],[407,122],[391,132],[373,121],[357,111]],
    [[902,197],[913,205],[918,220],[912,233],[906,220]],
    [[918,236],[928,245],[932,260],[924,276],[916,263]],
    [[941,389],[950,397],[946,413],[937,418],[934,404]],
    [[936,425],[943,434],[938,448],[930,440]],
    [[578,322],[585,337],[582,357],[573,369],[568,350]]
  ];

  function pathLength(points){return points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+Math.hypot(next[0]-point[0],next[1]-point[1])},0)}

  function allocateNodes(total){
    const minimum=12,lengths=CONTROL_PATHS.map(pathLength),usable=total-minimum*CONTROL_PATHS.length,totalLength=lengths.reduce((sum,value)=>sum+value,0);
    const raw=lengths.map(length=>usable*length/totalLength),counts=raw.map(value=>minimum+Math.floor(value));
    let remaining=total-counts.reduce((sum,value)=>sum+value,0);
    raw.map((value,index)=>({index,fraction:value-Math.floor(value)})).sort((a,b)=>b.fraction-a.fraction).slice(0,remaining).forEach(item=>counts[item.index]++);
    return counts;
  }

  function samplePath(points,count,pathIndex){
    const segments=points.map((point,index)=>{const next=points[(index+1)%points.length];return {from:point,to:next,length:Math.hypot(next[0]-point[0],next[1]-point[1])}}),total=segments.reduce((sum,item)=>sum+item.length,0),result=[];
    let segmentIndex=0,passed=0;
    for(let index=0;index<count;index++){
      const target=index*total/count;
      while(segmentIndex<segments.length-1&&passed+segments[segmentIndex].length<target){passed+=segments[segmentIndex].length;segmentIndex++}
      const segment=segments[segmentIndex],ratio=(target-passed)/segment.length,x=segment.from[0]+(segment.to[0]-segment.from[0])*ratio,y=segment.from[1]+(segment.to[1]-segment.from[1])*ratio;
      const nx=-(segment.to[1]-segment.from[1])/segment.length,ny=(segment.to[0]-segment.from[0])/segment.length,amplitude=points.length<=6?.22:.62,wave=Math.sin((index+1)*(2.13+pathIndex*.07))*.62+Math.sin((index+3)*5.17)*.38;
      result.push([x+nx*amplitude*wave,y+ny*amplitude*wave]);
    }
    return result;
  }

  function landSvg(total=1000){
    const counts=allocateNodes(total);
    return CONTROL_PATHS.map((path,index)=>`<polygon data-land-index="${index}" data-node-count="${counts[index]}" points="${samplePath(path,counts[index],index).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"/>`).join("");
  }

  window.SERPENT_WORLD_MAP={nodeCount:1000,pathCount:CONTROL_PATHS.length,allocations:allocateNodes(1000),landSvg};
})();
