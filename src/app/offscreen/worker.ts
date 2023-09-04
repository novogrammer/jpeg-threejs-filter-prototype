import { MyData, MyDataExecute, MyDataInitialize } from "./MyData";



import * as THREE from "three";

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

interface MyUniforms {
  uTexture:{
    type:"t",
    value:THREE.Texture,
  },
  time: { value: number },
}

interface ThreeObjects{
  renderer:THREE.WebGLRenderer,
  scene:THREE.Scene,
  camera:THREE.OrthographicCamera,
  uniforms:MyUniforms,
  offscreenCanvas:OffscreenCanvas,
}


class MyWorker{
  worker:Worker;
  threeObjects?:ThreeObjects;
  constructor(){
    this.worker=self as unknown as Worker;
    this.worker.addEventListener("message", ({ data }: MessageEvent<MyData>) => {
      switch(data.type){
        case "initialize":
          this.onInitialize(data);
          break;
        case "execute":
          this.onExecute(data);
        break;
        default:
          console.error("unknown type");
          break;
      }
    });
  }
  onInitialize(data:MyDataInitialize){
    const renderer = new THREE.WebGLRenderer({
      canvas:data.offscreenCanvas,
      preserveDrawingBuffer:true,
    });
    console.log(data.width,data.height);
    renderer.setSize(data.width,data.height,false);
    const scene=new THREE.Scene();
    const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    const geometry = new THREE.PlaneGeometry( 2, 2 );
    // テクスチャのflipYが効かない。
    geometry.scale(1,-1,1);

    const uniforms:MyUniforms = {
      uTexture:{
        type:"t",
        value:new THREE.Texture(),
      },
      time: { value: 1.0 }
    };

    const material = new THREE.ShaderMaterial( {
      uniforms: uniforms as any,
      vertexShader:vs,
      fragmentShader: fs,
      // テクスチャのflipYが効かない。
      side:THREE.DoubleSide,
    } );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    this.threeObjects={
      renderer,
      scene,
      camera,
      uniforms,
      offscreenCanvas:data.offscreenCanvas,
    };
  }
  onExecute(data:MyDataExecute){
    if(!this.threeObjects){
      console.error("this.threeObjects is null");
      return;
    }
    const {renderer,scene,camera,uniforms,offscreenCanvas}=this.threeObjects;
    const mainAsync = async():Promise<string>=>{
      const bin = atob(data.imageData.replace(/^.*,/, ''));
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i+=1) {
          arr[i] = bin.charCodeAt(i);
      }

      const imageBlob=new Blob([arr.buffer],{
        type:"image/jpeg",
      })
      const imageBitmap=await createImageBitmap(imageBlob);

      // {
      //   return await new Promise((resolve)=>{

      //     const reader = new FileReader();
  
      //     reader.onload=()=>{
      //       resolve(reader.result as string);
      //     }
      //     reader.readAsDataURL(imageBlob);
      //   })
      // }


      // console.log(imageBitmap);
      const texture=new THREE.Texture(imageBitmap);

      // texture.flipY = ! texture.flipY;
      texture.needsUpdate=true;
      uniforms.uTexture.value=texture;
      await new Promise((resolve)=>{
        setTimeout(resolve,1000)
      })

      renderer.render(scene,camera);

      const newDataBlob=await offscreenCanvas.convertToBlob({
        type:"image/jpeg",
        quality:0.8,
      });
      return await new Promise((resolve)=>{
        const reader = new FileReader();

        reader.onload=()=>{
          resolve(reader.result as string);
        }
        reader.readAsDataURL(newDataBlob);
      })


    };

    mainAsync().then((imageData)=>{
      this.worker.postMessage({ imageData });

    }).catch((error)=>{
      console.error(error);
    })



  }
}

const myWorker=new MyWorker();

