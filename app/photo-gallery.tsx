'use client';
import {useEffect,useState} from 'react';
import type {Slide} from '../lib/model';
export default function PhotoGallery({slide,focusIndex}:{slide:Slide;focusIndex?:number|null}){
 const photos=slide.photos?.length?slide.photos:slide.src?[slide.src]:[];
 const mode=slide.photoMode||'single', count=mode==='collage'?(slide.collageCount||4):1;
 const pages=Math.ceil(photos.length/count),signature=photos.join('|');
 const [page,setPage]=useState(0),[previous,setPrevious]=useState<number|null>(null);
 useEffect(()=>{setPage(focusIndex!=null?Math.floor(focusIndex/count):0);setPrevious(null);if(focusIndex!=null)return;if(mode==='single'||pages<2)return;let n=0;const timer=setInterval(()=>{setPrevious(n);n=(n+1)%pages;setPage(n)},(slide.photoSeconds||5)*1000);return()=>clearInterval(timer)},[signature,mode,count,pages,slide.photoSeconds,focusIndex]);
 useEffect(()=>{if(!photos.length)return;const next=(page+1)%pages;photos.slice(next*count,(next+1)*count).forEach(src=>{const image=new Image();image.src=src;void image.decode().catch(()=>{})})},[page,signature,count,pages]);
 const renderPage=(n:number,old=false)=>{const batch=photos.slice(n*count,(n+1)*count);return <div key={(old?'old':'new')+n} className={`photo-page ${old?'photo-previous':'photo-current'} photo-grid-${batch.length}`} style={{'--photo-time':(slide.photoSeconds||5)+'s'} as React.CSSProperties}>{batch.map((src,i)=>{const edit=slide.photoEdits?.[n*count+i];return <figure key={src+i}><img src={src} alt={`${slide.title}, photo ${n*count+i+1}`} onError={e=>{e.currentTarget.style.opacity='0'}} style={{objectFit:edit?.fit||slide.photoFit||'cover',objectPosition:`${edit?.x??50}% ${edit?.y??50}%`,transform:`scale(${edit?.scale??1})`,transformOrigin:`${edit?.x??50}% ${edit?.y??50}%`}}/><span aria-hidden="true" className="photo-fallback">Photo unavailable</span></figure>})}</div>};
 return <div className={`photo-gallery photo-mode-${mode}`} aria-label={slide.title}>{photos.length? <>{previous!==null&&renderPage(previous%pages,true)}{renderPage(page%pages)}</>:<p className="photo-empty">Add photos to this slide</p>}</div>
}
