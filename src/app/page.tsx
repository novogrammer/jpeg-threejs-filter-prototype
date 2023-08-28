'use client'
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import styles from './page.module.css'
import { useCallback, useState,MouseEvent } from 'react'

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

  const [image,setImage]=useState<string|undefined>(undefined);

  // useEffect(()=>{

  // },[]);
  const onGetImage=useCallback((event:MouseEvent<HTMLButtonElement>)=>{
    // event.preventDefault();
    // event.stopPropagation();
    fetch("/get").then((response)=>response.json()).then((json:GetBody)=>{
      switch(json.result){
        case "ok":
          console.log(json.data);
          setImage((_previousImage)=>{
            return json.data;
          })
          break;
        case "timeout":
          console.log("timeout");
          break;
        case "error":
          console.log(`error message:${json.message}`)
          break;
        default:
          console.log("unknown result");
          break;
      }
    }).catch((_error)=>{

      console.log("error");
    })
  },[]);
  const onSetImage=useCallback((event:MouseEvent<HTMLButtonElement>)=>{
    // event.preventDefault();
    // event.stopPropagation();
    console.log("before set");
    if(image===undefined){
      console.log("skip");
      return;
    }
    const body={
      data:image,
    };
    fetch("/set",{
      method:"POST",
      headers:{
        "Content-Type": "application/json",
      },
      body:JSON.stringify(body),
    }).then((response)=>response.json()).then((json)=>{
      switch(json.result){
        case "ok":
          console.log("ok");
          break;
        default:
          console.log("unknown result");
          break;
      }
    });
  },[image]);
  

  return (
    <main>
      <div>
        <button onClick={onGetImage}>get</button>
        <button onClick={onSetImage}>set</button>
      </div>
      <div>
        <img src={image} alt="" />
      </div>
    </main>
  )
}
