
export interface MyDataInitialize{
  type:"initialize";
  offscreenCanvas:OffscreenCanvas;
  width:number;
  height:number;
}
export interface MyDataExecute{
  type:"execute";
  imageData:string;
}

export type MyData=MyDataInitialize | MyDataExecute;