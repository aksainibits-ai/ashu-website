export default function MarkdownArticle({source}:{source:string}){
 const lines=source.split(/\r?\n/);const nodes:React.ReactNode[]=[];let para:string[]=[];let list:string[]=[];
 const flushP=()=>{if(para.length){nodes.push(<p className="leading-8 text-slate-300 mb-5" key={`p-${nodes.length}`}>{para.join(" ").replace(/\*\*/g,"")}</p>);para=[];}};
 const flushL=()=>{if(list.length){nodes.push(<ul className="list-disc pl-6 space-y-2 text-slate-300 mb-5" key={`ul-${nodes.length}`}>{list.map((x,i)=><li key={i}>{x}</li>)}</ul>);list=[];}};
 for(const line of lines){const s=line.trim();if(!s){flushP();flushL();}else if(s.startsWith("# ")){flushP();flushL();nodes.push(<h2 className="serif text-3xl mt-10 mb-4" key={nodes.length}>{s.slice(2)}</h2>);}else if(s.startsWith("## ")){flushP();flushL();nodes.push(<h3 className="serif text-2xl mt-8 mb-3" key={nodes.length}>{s.slice(3)}</h3>);}else if(s.startsWith("- ")||s.startsWith("* ")){flushP();list.push(s.slice(2));}else{flushL();para.push(s);}}
 flushP();flushL();return <div className="prose max-w-none">{nodes}</div>;
}