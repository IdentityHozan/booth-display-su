'use client';
import {useLayoutEffect,useState,useRef,type ComponentProps,type CSSProperties} from 'react';
import Frame from './broadcast-frame';
type Props=ComponentProps<typeof Frame>&{frameKey:string};
export default function BroadcastStage(props:Props){
 const [shown,setShown]=useState(props),[wipe,setWipe]=useState<string|null>(null);const latest=useRef(props),retained=useRef(props);latest.current=props;
 useLayoutEffect(()=>{if(shown.frameKey===props.frameKey)return;const target=props.frameKey;const duration=(props.transitionMs||400)*2;setWipe(target);const change=setTimeout(()=>setShown(latest.current),duration*.5);const finish=setTimeout(()=>setWipe(null),duration+200);return()=>{clearTimeout(change);clearTimeout(finish)}},[props.frameKey]);
 const active=shown.frameKey===props.frameKey;if(active)retained.current=props;const scene=active?props:retained.current;
 return <div className={`broadcast-stage stage-${props.theme||'dark'}`} style={{'--wipe-time':((props.transitionMs||400)*2)+'ms'} as CSSProperties}><div className="broadcast-layer" key={`scene:${shown.frameKey}`}><Frame {...scene} inactive={!active} onEnd={active?props.onEnd:undefined}/></div>{wipe&&<div key={`wipe:${wipe}`} className="broadcast-wipe" aria-hidden="true" onAnimationEnd={e=>{if(e.animationName==='clean-stinger')setWipe(null)}}><div/></div>}</div>
}
