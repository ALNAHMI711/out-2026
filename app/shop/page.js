"use client";
import {useEffect,useState} from "react";
export default function Shop(){
 const[p,setP]=useState([]),[e,setE]=useState("");
 useEffect(()=>{fetch("/api/products").then(r=>r.json()).then(d=>d.products?setP(d.products):setE(d.error||"تعذر تحميل المنتجات")).catch(()=>setE("تعذر الاتصال"))},[]);
 return <main className="min-h-screen bg-out-black p-6"><h1 className="text-4xl font-black gold-gradient mb-8">OUT 2026 — المتجر</h1>{e&&<p className="text-red-400 mb-5">{e}</p>}<div className="grid grid-cols-2 md:grid-cols-4 gap-5">{p.map(function(x){return <article key={x.id} className="bg-out-card border border-out-border rounded-xl p-3"><img src={(x.designs&&(x.designs.thumbnail_url||x.designs.image_url))||"/placeholder.svg"} alt="" className="w-full aspect-square object-cover rounded-lg"/><h2 className="font-bold mt-3">{x.name_ar}</h2><p className="text-out-gold">$ {(x.price_cents/100).toFixed(2)}</p></article>})}</div></main>
}