import express from "express";
import next from "next";

const dev = process.env.NODE_ENV !== 'production';
const port = 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const sleepAsync=(t)=>new Promise((resolve)=>{
  setTimeout(resolve,t*1000);
});

(async () => {
  try {
    await app.prepare();
    const server = express();
    const q=[];
    server.get("/add",(req,res)=>{
      const t=performance.now();
      q.push(t);
      res.send("added");
    })
    server.get("/get",async (req,res)=>{
      const beginTime=performance.now();
      try{
        let currentTime=performance.now();
        while(currentTime-beginTime<5*1000){
          const t=q.shift();
          if(t!==undefined){
            res.json({
              result:"ok",
              t:t,
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