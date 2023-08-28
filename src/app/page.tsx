'use client'
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import styles from './page.module.css'
import { useCallback, useState,MouseEvent, useEffect, useRef } from 'react'

import * as THREE from "three";
// import Stats from "../../node_modules/stats-gl/dist/stats-gl";
import Stats from "stats-gl";

// import Panel from "stats-gl"


const vs=`
varying vec2 vUv;

void main()	{
  vUv = uv;
  gl_Position = vec4( position, 1.0 );
}
`;
const fs=`
varying vec2 vUv;
uniform sampler2D uTexture;
void main()	{
  vec4 col = texture(uTexture, vUv);
  gl_FragColor = vec4(1.0 - col.r, 1.0 - col.g, 1.0 - col.b, col.a);
  // gl_FragColor=vec4(0.0,1.0,0.0,1.0);

}
`;


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
    console.log(THREE);

    if(!mainRef.current){
      return;
    }
    if(!canvasRef.current){
      // throw new Error("canvasRef.current is null.");
      return;
    }

    const stats=new Stats();
    mainRef.current.appendChild(stats.container);

    const renderer = new THREE.WebGLRenderer({
      canvas:canvasRef.current,
      preserveDrawingBuffer:true,
    });
    renderer.setSize(589,589);
    const scene=new THREE.Scene();
    const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    const geometry = new THREE.PlaneGeometry( 2, 2 );

    const uniforms = {
      uTexture:{
        type:"t",
        value:new THREE.Texture(),
      },
      time: { value: 1.0 }
    };

    const material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader:vs,
      fragmentShader: fs,
    } );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );


    stats.init( renderer.domElement );
    scene.onBeforeRender = function () {
  
      stats.begin();

    };

    scene.onAfterRender = function () {

      stats.end();

    };


    // const somePanel=new Stats.Panel( 'test', '#f00', '#200' );
    // stats.addPanel( somePanel, 2 );


    let needsQuit=false;
    const main=async ()=>{
      
      while(!needsQuit){
        const r=Math.random();
        // somePanel.update(r,r*100,1,100,2);
  
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
        uniforms.uTexture.value=await new THREE.TextureLoader().loadAsync(jsonGet.data);

        renderer.render(scene,camera);
        const newData=renderer.domElement.toDataURL("image/jpeg",0.8)
        // setImage((_previousImage)=>{
        //   return newData;
        // });
        
        const body={
          data:newData,
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
            break;
          default:
            console.log("unknown result");
            break;
        }

      }
    }
    main().catch(error=>{
      console.error(error);
    });
    return ()=>{
      needsQuit=true;
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
