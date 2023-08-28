import express from "express";
import next from "next";
import fs from "fs/promises";

const dev = process.env.NODE_ENV !== 'production';
const port = 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const sleepAsync=(t)=>new Promise((resolve)=>{
  setTimeout(resolve,t*1000);
});

const INPUT_IMAGE="./input.jpg";
const OUTPUT_IMAGE="./output.jpg";

(async () => {
  try {
    await app.prepare();
    const server = express();
    server.use(express.json())

    const bufferInputImage=await fs.readFile(INPUT_IMAGE);
    const base64InputImage=`data:image/jpeg;base64,${bufferInputImage.toString("base64")}`;

    const q=[];
    setInterval(()=>{
      if(q.length==0){
        q.push(base64InputImage);
      }
    },1000*10);
    // server.get("/add",(req,res)=>{
    //   q.push(base64InputImage);
    //   res.send("added");
    // })
    server.post("/set",(req,res)=>{
      console.log('setup: data', req.body.data);
      let base64OutputImage=req.body.data;
      if(typeof req.body.data !=="string"){
        res.json({
          result:"error",
          message:"data is not string",
        });
        return;
      }
      base64OutputImage=base64OutputImage.replace("data:image/jpeg;base64","");
      const bufferOutputImage=Buffer.from(base64OutputImage,"base64");
      fs.writeFile(OUTPUT_IMAGE,bufferOutputImage).then(()=>{
        res.json({
          result:"ok",
        });
      }).catch((error)=>{
        if(error instanceof Error){
          res.json({
            result:"error",
            message:error.message,
          });
        }else{
          res.json({
            result:"error",
            message:"unknown",
          });
        }
      })
    });

    server.get("/get",async (req,res)=>{
      const beginTime=performance.now();
      try{
        let currentTime=performance.now();
        while(currentTime-beginTime<5*1000){
          const base64Image=q.shift();
          if(base64Image!==undefined){
            res.json({
              result:"ok",
              data:base64Image,
            });
            return;
          }
          await sleepAsync(0.1);
          currentTime=performance.now();
        }
        throw new Error("timeout");
      }catch(error){
        if(error.message=="timeout"){
          res.json({
            result:"timeout",
          });
        }else{
          res.json({
            result:"some error",
            message:error.message,
          })
        }
      }
    })
    server.all("*", (req, res) => {
      return handle(req, res);
    });
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  } catch (e) {
    console.error(e);
  }
})();