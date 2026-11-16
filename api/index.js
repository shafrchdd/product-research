const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const client = new MongoClient(process.env.MONGODB_URI);
let dbPromise;

function db() {
  if (!dbPromise) dbPromise = client.connect().then(() => client.db(process.env.MONGODB_DB || "product_lab"));
  return dbPromise;
}

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  Object.entries(extraHeaders).forEach(([k,v]) => res.setHeader(k,v));
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cookieOptions(value, maxAge) {
  return `pl_session=${value}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").map(x => x.trim()).filter(Boolean).map(x => {
    const i=x.indexOf("="); return [i<0?x:x.slice(0,i), i<0?"":decodeURIComponent(x.slice(i+1))];
  }));
}

function sign(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

function verify(token) {
  if (!token) return null;
  const [body,sig] = token.split(".");
  if (!body || !sig || !process.env.JWT_SECRET) return null;
  const expected=crypto.createHmac("sha256",process.env.JWT_SECRET).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
  const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
  if (!p.exp || p.exp < Math.floor(Date.now()/1000)) return null;
  return p;
}

async function body(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve,reject)=>{
    let s=""; req.on("data",c=>s+=c); req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}}); req.on("error",reject);
  });
}

function cors(req,res) {
  const origin=process.env.FRONTEND_ORIGIN || req.headers.origin || "";
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials","true");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS");
}

async function auth(req,res) {
  const user=verify(parseCookies(req).pl_session);
  if (!user) { json(res,401,{error:"Not authenticated"}); return null; }
  return user;
}

module.exports = async function handler(req,res) {
  cors(req,res);
  if (req.method==="OPTIONS") return json(res,204,{});
  const url=new URL(req.url, "http://localhost");
  const path=url.pathname.replace(/^\/api\/?/,"");

  try {
    if (path==="health" && req.method==="GET") return json(res,200,{ok:true,service:"product-lab-api"});
    if (path==="login" && req.method==="POST") {
      const b=await body(req);
      if (b.username!==process.env.APP_USERNAME || b.password!==process.env.APP_PASSWORD)
        return json(res,401,{error:"Invalid username or password"});
      const token=sign({sub:b.username,exp:Math.floor(Date.now()/1000)+60*60*24*7});
      return json(res,200,{ok:true},{ "Set-Cookie":cookieOptions(token,60*60*24*7) });
    }
    if (path==="logout" && req.method==="POST")
      return json(res,200,{ok:true},{ "Set-Cookie":cookieOptions("",0) });
    if (path==="me" && req.method==="GET") {
      const user=await auth(req,res); if(!user)return;
      return json(res,200,{authenticated:true,username:user.sub});
    }

    const user=await auth(req,res); if(!user)return;
    const collection=(await db()).collection("products");
    const parts=path.split("/").filter(Boolean);

    if (path==="products" && req.method==="GET") {
      const products=await collection.find({owner:user.sub}).sort({updated:-1}).toArray();
      return json(res,200,{products});
    }
    if (path==="products" && req.method==="POST") {
      const p=await body(req); p.owner=user.sub;
      await collection.insertOne(p);
      return json(res,201,{product:p});
    }
    if (path==="products/bulk" && req.method==="POST") {
      const b=await body(req); const products=Array.isArray(b.products)?b.products:[];
      await collection.deleteMany({owner:user.sub});
      if(products.length) await collection.insertMany(products.map(p=>({...p,owner:user.sub})));
      return json(res,200,{count:products.length});
    }
    if (parts[0]==="products" && parts[1] && req.method==="PUT") {
      const p=await body(req); p.owner=user.sub; p.id=parts[1];
      const result=await collection.replaceOne({id:parts[1],owner:user.sub},p);
      if(!result.matchedCount)return json(res,404,{error:"Product not found"});
      return json(res,200,{product:p});
    }
    if (parts[0]==="products" && parts[1] && req.method==="DELETE") {
      const result=await collection.deleteOne({id:parts[1],owner:user.sub});
      if(!result.deletedCount)return json(res,404,{error:"Product not found"});
      return json(res,200,{ok:true});
    }
    return json(res,404,{error:"Route not found"});
  } catch (e) {
    console.error(e);
    return json(res,500,{error:"Server error"});
  }
};