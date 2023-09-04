'use client'
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import styles from './page.module.css'
import { useCallback, useState,MouseEvent, useEffect, useRef } from 'react'

import * as THREE from "three";

import { MyDataInitialize,MyDataExecute } from './MyData';




interface GetBodyOk{
  result:"ok";
  data:string;
}
interface GetBodyTimeout{
  result:"timeout";

}
interface GetBodyError{
  result:"error";
  message:string;
}

type GetBody=GetBodyOk|GetBodyTimeout|GetBodyError;

export default function Home() {

  // const [image,setImage]=useState<string|undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(()=>{

    if(!mainRef.current){
      return;
    }
    if(!canvasRef.current){
      // throw new Error("canvasRef.current is null.");
      return;
    }

    const worker = new Worker(new URL("./worker.ts", import.meta.url));
    let processingCount=0
    worker.addEventListener("message", async (event:{data:{imageData:string}}) => {
      // console.log(event.data.imageData);
      const body={
        data:event.data.imageData,
      };
      const jsonSet = await fetch("/set",{
        method:"POST",
        headers:{
          "Content-Type": "application/json",
        },
        body:JSON.stringify(body),
      }).then((response)=>response.json());
      switch(jsonSet.result){
        case "ok":
          console.log("ok");
          processingCount-=1;
          console.log(`processingCount : ${processingCount}`);
          break;
        case "error":
          console.log(`error: ${jsonSet.message}`);
          break;
        default:
          console.log("unknown result on set");
          break;
      }

    });
    {
      const offscreenCanvas=canvasRef.current.transferControlToOffscreen();
      const data:MyDataInitialize={
        type:"initialize",
        offscreenCanvas,
        width:589,
        height:589,
      };
      worker.postMessage(data,[offscreenCanvas]);
    }





    let needsQuit=false;
    const main=async ()=>{
      
      while(!needsQuit){
        const r=Math.random();
        // somePanel.update(r,r*100,1,100,2);
  
        if(processingCount>100){
        await new Promise((resolve)=>setTimeout(resolve,100));
        continue;
        }
        const jsonGet:GetBody = await fetch("/get").then((response)=>response.json());

        switch(jsonGet.result){
          case "ok":
            break;
          case "timeout":
            console.log("timeout");
            continue;
          case "error":
            throw new Error(jsonGet.message);
          default:
            throw new Error("unknown result");
        }
        const data:MyDataExecute={
          type:"execute",
          imageData:jsonGet.data,
        }
        worker.postMessage(data);
        processingCount+=1;
        // setImage((_previousImage)=>{
        //   return newData;
        // });

      }
    }
    main().catch(error=>{
      console.error(error);
    });
    return ()=>{
      needsQuit=true;
      worker.terminate();
    };
  },[]);
  // const onGetImage=useCallback((event:MouseEvent<HTMLButtonElement>)=>{
  //   // event.preventDefault();
  //   // event.stopPropagation();
  //   fetch("/get").then((response)=>response.json()).then((json:GetBody)=>{
  //     switch(json.result){
  //       case "ok":
  //         console.log(json.data);
  //         setImage((_previousImage)=>{
  //           return json.data;
  //         })
  //         break;
  //       case "timeout":
  //         console.log("timeout");
  //         break;
  //       case "error":
  //         console.log(`error message:${json.message}`)
  //         break;
  //       default:
  //         console.log("unknown result");
  //         break;
  //     }
  //   }).catch((_error)=>{

  //     console.log("error");
  //   })
  // },[]);
  // const onSetImage=useCallback((event:MouseEvent<HTMLButtonElement>)=>{
  //   // event.preventDefault();
  //   // event.stopPropagation();
  //   console.log("before set");
  //   if(image===undefined){
  //     console.log("skip");
  //     return;
  //   }
  //   const body={
  //     data:image,
  //   };
  //   fetch("/set",{
  //     method:"POST",
  //     headers:{
  //       "Content-Type": "application/json",
  //     },
  //     body:JSON.stringify(body),
  //   }).then((response)=>response.json()).then((json)=>{
  //     switch(json.result){
  //       case "ok":
  //         console.log("ok");
  //         break;
  //       default:
  //         console.log("unknown result");
  //         break;
  //     }
  //   });
  // },[image]);
  

  return (
    <main ref={mainRef}>
      <div>
        <canvas ref={canvasRef}></canvas>
      </div>
      {/* <div>
        <button onClick={onGetImage}>get</button>
        <button onClick={onSetImage}>set</button>
      </div> */}
      {/* <div>
        <img src={image} alt="" />
      </div> */}
    </main>
  )
}
